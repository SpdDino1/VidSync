/*
 * 
 *  Class to connect, disconnect and emit messages to the websocket server.
 *
 *  New webSocketManager object required for each sync as name and video source are stored in object. They can
 *  change per sync
 * 
*/

import config from '../../config';
import tags from '../tags';
import { emitMessageToBackgroundScript as emitMessageToPopUpScript, emitToContentScriptInTab } from "../utils/emitMessageMethods";
import appendToStateObject from "../utils/appendToStateObject";

export default class WebSocketManager {
    //      Instance Attributes
    //  name;
    //  videoSrc;
    //  socket;
    //  onMessageBackgroundListener;
    //  mainManagerInstance

    //  isCannotConnect

    constructor(name, src, mainManagerInstance) {
        this.name = name;
        this.videoSrc = src;
        this.mainManagerInstance = mainManagerInstance;
        this.socket = null;

        //  onClose fired immediately after onError. Helps check and give meaningful error
        this.isCannotConnect = false;
    }

    connectToSocketServer() {
        this.socket = new WebSocket(config["socketServerUrl"]);

        this.socket.onerror = () => { this.onErrorListener(); }
        this.socket.onclose = () => { this.onCloseListener(); }
        this.socket.onopen = () => { this.onOpenListener(); }
        this.socket.onmessage = (message) => { this.onMessageListener(this.parseServerMessage(message)) };
    }

    sendMessageToServer(message) {
        this.socket.send(JSON.stringify(message));
    }

    disconnectFromSocketServer() {
        this.socket.close();
    }

    //
    //  Listeners
    //
    onErrorListener() {
        this.setStateAndDisplayMessage(tags["states"]["connectionError"]);
        this.isCannotConnect = true;
    }
    onCloseListener() {
        if (this.isCannotConnect) {
            this.isCannotConnect = false;
            return;
        }

        this.setStateAndDisplayMessage(tags["states"]["connectionClose"]);
    }
    onOpenListener() {
        //  Send participant details
        const message = {
            "tag": tags["socketServerTags"]["update"],
            "name": this.name,
            "videoSrc": this.videoSrc
        }
        this.sendMessageToServer(message);
    }
    onMessageListener(data) {
        switch (data["tag"]) {

            case tags["socketServerTags"]["update"]:
                if (!data["message"]["isUpdate"]) {
                    this.isCannotConnect = true;

                    this.setStateAndDisplayMessage(
                        appendToStateObject(tags["states"]["updationServerFailed"], data["message"]["videoSrc"])
                    );
                    return;
                }
                this.setStateAndDisplayMessage(tags["states"]["syncing"]);
                break;

            case tags["socketServerTags"]["pause"]:
                this.mainManagerInstance.videoTagManagerInstance.pauseVideo(data["name"]);
                break;

            case tags["socketServerTags"]["play"]:
                this.mainManagerInstance.videoTagManagerInstance.playVideo(data["name"]);
                break;

            case tags["socketServerTags"]["seek"]:
                this.mainManagerInstance.videoTagManagerInstance.seekVideo(data["message"], data["name"]);
                break;

            case tags["socketServerTags"]["getTime"]:
            case tags["socketServerTags"]["getTimeAutoSync"]:
            case tags["socketServerTags"]["updateTime"]:
                this.mainManagerInstance.videoTagManagerInstance.getTime(data["tag"]);
                break;


            case tags["socketServerTags"]["syncAll"]:
            case tags["socketServerTags"]["syncAllNewJoin"]:
                this.mainManagerInstance.videoTagManagerInstance.sync(data["tag"], data["message"]);
                break;

        }
    }

    parseServerMessage(message) {
        //  Server message present within 'data' object (Web Specification)
        return JSON.parse(message.data);
    }

    setStateAndDisplayMessage(stateObject) {
        this.mainManagerInstance.stateManagerInstance.setState(stateObject);

        emitToContentScriptInTab(
            this.mainManagerInstance.tabMonitorInstance.getTabId(),
            { "tag": tags["states"]["stateTag"], "stateObj": stateObject }
        );

        try {
            //  Pop Up could be closed
            emitMessageToPopUpScript({ "tag": tags["states"]["stateTag"], "stateObj": stateObject });
        } catch (e) { }
    }
}