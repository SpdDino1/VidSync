//
//  Imports
//
const express = require('express');
const app = express();

const http = require("http");
const server = http.createServer(app)

const ws = require('ws');
const wss = new ws.Server({ server: server });

const config = require("./config");

const roomClass = require("./src/room");
const room = new roomClass();

//
//  WebSocket Events
// 

wss.on("connection", (socket) => {
    console.log("[Socket] New connection!");
    room.addParticipant(socket);
})

wss.on("error", (err) => {
    console.log(err);
})

//
//  WebServer Routes
//
app.get("/flushRoom", (req, res) => {
    room.flushRoom();
    res.end();
})

app.get("/viewRoom", (req, res) => {
    room.showRoomParticipants(res);
})

//
//  Server Initialization
//
server.listen(config["serverPort"], () => {
    console.log("Listening on port " + config["serverPort"] + "...");
})