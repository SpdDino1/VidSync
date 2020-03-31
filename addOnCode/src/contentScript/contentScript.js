const videoTags = document.getElementsByTagName("video");

//  Listen for messages
browser.runtime.onMessage.addListener((data) => {

    //  Check if video tag present/accessible
    if (data["tag"] == tags["popUpContent"]["videoTagAccess"]) {
        if (videoTags.length != 0) {
            return Promise.resolve({ "result": true });
        }
        return Promise.resolve({ "result": false });
    }

});

//  Fired on tab close/url change
window.addEventListener("beforeunload", () => {
    browser.runtime.sendMessage({
        "tag": tags["contentBackground"]["windowClose"]
    });
})