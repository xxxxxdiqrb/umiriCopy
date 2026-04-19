chrome.runtime.onMessage.addListener(handleMessages);
function handleMessages(message, sender, sendResponse) {
    switch (message.type) {
        case 'downloadImageList': downloadImageHandler(message, sendResponse); break;
        case 'GMFetch': GMFetch(message, sendResponse); break;
    }
    return true
}

async function GMFetch(message, sendResponse) {
    try {
        const res = await fetch(message.url, message.option)
        if (res.ok) {
            const format = await res[message.formatType || 'text']()
            sendResponse({
                isSuccess: true,
                data: format,
            })
        } else {
            sendResponse({
                isSuccess: false,
                reason: `${res.status} ${res.statusText}`,
            })
        }
    } catch (err) {
        sendResponse({
            isSuccess: false,
            reason: err.message
        })
    }
}

async function downloadImageHandler(message, sendResponse) {
    try {
        const pathList = await downloadImage(message.data)
        sendResponse({
            isSuccess: true,
            pathList: pathList
        })
    } catch (err) {
        sendResponse({
            isSuccess: false,
            reason: err.message
        })
    }
}

const imageDirName = 'twitterImage'
function downloadImage(dataList) {
    return new Promise((res, rej) => {
        const absolutePath = []

        chrome.downloads.onChanged.addListener(changeHandler)
        for (const data of dataList) {
            chrome.downloads.download({
                url: data.url,
                saveAs: true,
                filename: `${imageDirName}/${data.name}`,
                conflictAction: 'overwrite'
            })
        }

        function changeHandler(e) {
            if (e.filename?.current) {
                absolutePath.push(e.filename?.current)
            }
            if (e.state?.current === "complete" && absolutePath.length === dataList.length) {
                removeHandler()
                res(absolutePath)
            }
            if (e.state?.current === 'interrupted') {
                removeHandler()
                rej(e.state)
            }
        }

        function removeHandler() {
            // chrome.downloads.onChanged.removeListener(changeHandler)
        }
    })
}
