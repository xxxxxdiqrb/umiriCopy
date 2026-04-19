; (async function () {
    const option = (await chrome.storage.local.get("options")).options || {}

    const [showLoadingPanel, hideLoadingPanel, setLoadingPanel] = initLoadingPanel()

    initPageChangeListener()

    function initLoadingPanel() {
        const loadingPanel = createElement(`
            <div style="z-index: 20000; position: fixed; top: 0; left: 0; width: 100%; height: 100%">
                <div style="background-color: rgba(0, 0, 0, 0.6); width: 100%; height: 100%"></div>
                    <div
                        class="text"
                        style="
                            box-sizing: border-box;
                            font-size: 16px;
                            border-radius: 2px;
                            position: fixed;
                            background-color: rgb(255, 255, 255);
                            padding: 20px;
                            transform-origin: 0% 0% 0px;
                            transform: translate3d(-50%, -50%, 0px);
                            flex-direction: column;
                            left: 50%;
                            top: 50%;
                            display: flex;
                        ">
                            正在复制
                    </div>
                </div>
        `)
        const textNode = loadingPanel.querySelector('.text')


        function showLoadingPanel() {
            document.body.appendChild(loadingPanel)
        }
        function setLoadingPanel(innerText) {
            textNode.innerText = innerText
        }
        function hideLoadingPanel() {
            document.body.removeChild(loadingPanel)
        }
        return [showLoadingPanel, hideLoadingPanel, setLoadingPanel]
    }

    function initPageChangeListener() {
        const main = document.querySelector('main')
        if (!main) {
            requestAnimationFrame(initPageChangeListener)
            return
        }

        addObserver(main.children[0], initTweetChangeListener)
    }

    function initTweetChangeListener() {
        let curr = document.querySelector('article')

        while (!curr) {
            requestAnimationFrame(initTweetChangeListener)
            return
        }

        console.log('----------initTweetChangeListener----------------')
        let listNode
        while (!listNode) {
            if (curr.dataset.testid === 'cellInnerDiv') {
                listNode = curr.parentElement
                break
            }
            curr = curr.parentElement
        }

        addObserver(listNode, addCopyButton)
        addObserver(listNode.parentElement, initTweetChangeListener)
    }

    function addObserver(element, handler) {
        const observer = new MutationObserver(handler);
        observer.observe(element, {
            childList: true
        });
    }

    function addCopyButton() {
        const articleList = Array.from(document.querySelectorAll("article"))
        for (const article of articleList) {
            if (article.parentElement.querySelector('button.copy')) {
                continue
            }

            const copyButton = createElement(`
                <button
                    class="copy"
                    type="button"
                    style="
                        cursor: pointer;
                        border: 1px solid rgb(53, 53, 53);
                        z-index: 1000;
                        line-height: 1.5;
                        border-radius: 2px;
                        position: fixed;
                        background-color: white;
                        padding: 2px 6px;
                        transform-origin: 0% 0% 0px;
                        bottom: 10px;
                        left: 10px;
                        font-size: 12px;
                        color: rgb(53, 53, 53);
                    "
                >
                    复制
                </button>
            `)
            article.parentElement.appendChild(copyButton)
            copyButton.addEventListener("click", async () => {
                showLoadingPanel()

                try {
                    const copyString = await copyTweet(article)
                    addActionbar('资源获取完成', '复制内容', () => {
                        setClipboard(copyString)
                    })
                } catch (e) {
                    console.log('---------copyError------------')
                    console.log(e)
                    addActionbar('资源获取失败：' + e.toString(), '确定')
                }

                hideLoadingPanel()
            })
        }
    }

    function addActionbar(messageText, buttonText, clickHandler) {
        const actionbar = createElement(`
             <div style="background-color: rgba(0, 0, 0, 0.6); z-index: 20000; position: fixed; top: 0; left: 0; width: 100%; height: 100%">
                <div
                    style="
                        box-sizing: border-box;
                        font-size: 16px;
                        border-radius: 2px;
                        position: fixed;
                        background-color: rgb(255, 255, 255);
                        padding: 16px 20px;
                        transform-origin: 0% 0% 0px;
                        transform: translate3d(-50%, -50%, 0px);
                        flex-direction: column;
                        left: 50%;
                        top: 50%;
                    "
                >
                    <div class="text" style="box-sizing: border-box; margin-bottom: 14px">${messageText}</div>
                    <button
                        type="button"
                        style="
                            text-align: center;
                            width: 100%;
                            border-radius: 2px;
                            background-color: rgb(53, 53, 53);
                            padding: 6px 12px;
                            transform-origin: 0% 0% 0px;
                            font-size: 12px;
                            color: rgb(255, 255, 255);
                            line-height: 1.5;
                            opacity: 1;
                        "
                        onmousedown="this.style.opacity = 0.6"
                        onmouseup="this.style.opacity = 1"
                    >
                        ${buttonText}
                    </button>
                </div>
            </div>
        `)
        const button = actionbar.querySelector('button')

        document.body.appendChild(actionbar)

        button.addEventListener('click', () => {
            document.body.removeChild(actionbar)
            clickHandler && clickHandler()
        })
    }

    function createElement(htmlString) {
        const range = document.createRange()
        return range.createContextualFragment(htmlString).children[0]
    }

    async function copyTweet(article) {
        const copyContentList = []

        setLoadingPanel('正在获取截图')

        const [hideVideo, showVideo] = initCorsVideoTemporaryStorage(article)
        await setVideoSize(article)
        await hideVideo()

        const divList = Array.from(article.querySelectorAll("div"))

        const userNameDiv = divList.find((div) => div.dataset.testid === "User-Name")
        const userName = userNameDiv.children[1].innerText.split('\n').shift()
        const articleScreenShotBase64 = await getScreenShot(article)

        const timeElemnt = article.querySelector('a > time')
        let timeStr = timeElemnt ? new Date(timeElemnt.dateTime).toLocaleString() : new Date().toLocaleDateString()
        timeStr = timeStr.replaceAll('/', '-').replaceAll(':', '')
        const tweetName = `${userName}_${timeStr}`
        const localScreenShot = await getLocalImage([{
            name: `${tweetName}.jpg`,
            url: articleScreenShotBase64
        }])
        copyContentList.push(`<img src="${localScreenShot}"/>`)

        const textDiv = divList.find((div) => div.dataset.testid === "tweetText")
        if (textDiv) {
            const textContent = getTweetText(textDiv)

            const copyType = (await chrome.storage.local.get("textCopyType")).textCopyType
            console.log(copyType)
            if (copyType == null || copyType) {
                setLoadingPanel('正在翻译文本')
                const translatedText = await getOpenAITranslation(textContent)
                copyContentList.unshift(translatedText)
            } else {
                copyContentList.unshift(textContent)
            }
        }

        let ariaLabelledbyDiv = divList.find(item => item.getAttribute('aria-labelledby'))
        let extraElement = ariaLabelledbyDiv && ariaLabelledbyDiv.children[0]
        const span = extraElement?.querySelector('span')
        if (ariaLabelledbyDiv && (!span || span.innerText === 'ALT' || span.parentElement.nodeName === 'A')) {
            const imgElementList = Array.from(extraElement.querySelectorAll("img"))
            let index = 1
            for (const imgElement of imgElementList) {
                setLoadingPanel(`正在获取图片（${index++}/${imgElementList.length}）`)

                const [baseUrl, search] = imgElement.src.split("?")
                let searchParam = new URLSearchParams(search)
                searchParam.set("name", "orig")

                const localImage = await getLocalImage([{
                    name: `${tweetName}_${baseUrl.split('/').pop()}.jpg`,
                    url: baseUrl + "?" + searchParam.toString()
                }])
                copyContentList.push(`<img src="${localImage}"/>`)
            }
        }

        await showVideo()

        console.log(copyContentList)

        return copyContentList.join("\n")
    }

    async function setVideoSize(article) {
        const videoElementList = Array.from(article.querySelectorAll('video'))
        if (videoElementList.length === 0) {
            return
        }

        for (const videoElement of videoElementList) {
            videoElement.pause()
            videoElement.currentTime = 0
        }
        await waitIdleCallBack()
        for (const videoElement of videoElementList) {
            const setAttri = videoElement.videoHeight > videoElement.videoWidth ? 'width' : 'height'
            setElementStyle(videoElement, {
                [setAttri]: 'auto',
                position: ''
            })

            setElementStyle(videoElement.parentElement, {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'black'
            })
        }
        await waitATick()
    }

    function initCorsVideoTemporaryStorage(article) {
        let videoList = Array.from(article.querySelectorAll('video'))
        videoList = videoList.filter(video => !!video.src)

        const temporaryStorage = []
        async function hideVideo() {
            for (const video of videoList) {
                const cover = document.createElement('img')
                cover.src = video.poster
                cover.style.cssText = 'object-fit: contain; width: 100%; height: 100%;';

                temporaryStorage.push({
                    parent: video.parentElement,
                    video: video,
                    cover: cover
                })

                video.parentElement.appendChild(cover)
                video.remove()
            }
            await waitATick()
        }

        async function showVideo() {
            for (const item of temporaryStorage) {
                item.cover.remove()
                item.parent.appendChild(item.video)
            }
            await waitATick()
        }

        return [hideVideo, showVideo]
    }


    function waitIdleCallBack() {
        return new Promise(res => {
            requestIdleCallback(res)
        })
    }

    function setElementStyle(element, option) {
        const keys = Object.keys(option)
        for (const key of keys) {
            element.style[key] = option[key]
        }
    }

    async function getScreenShot(article) {
        return await htmlToImage.toPng(article, { backgroundColor: "white" })
    }

    async function setClipboard(htmlString) {
        const type = "text/html"
        const blob = new Blob([htmlString], { type })
        const data = [new ClipboardItem({ [type]: blob })]
        await navigator.clipboard.write(data)
    }

    async function getBase64Image(url) {
        const blob = await fetch(url).then((res) => res.blob())
        return new Promise((res) => {
            const fileReader = new FileReader()
            fileReader.onload = () => {
                res(fileReader.result)
            }
            fileReader.readAsDataURL(blob)
        })
    }

    function getLocalImage(data) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'downloadImageList',
                data: data
            }, response => {
                if (response.isSuccess) {
                    resolve(response.pathList[0])
                } else {
                    reject(response.reason)
                }
            })
        })
    }

    function getTweetText(tweetTextElement) {
        const childrenList = Array.from(tweetTextElement.children)
        let textContent = ""
        for (const children of childrenList) {
            if (children.nodeName === "IMG") {
                textContent += children.alt
            } else {
                textContent += children.innerText
            }
        }
        return textContent
    }

    async function waitATick() {
        return new Promise(res => {
            requestAnimationFrame(res)
        })
    }

    async function getOpenAITranslation(text) {
        const fetchParam = {
            headers: {
                "content-type": "application/json",
                Authorization: "Bearer " + option.apiKey,
            },
            method: "POST",
            body: JSON.stringify({
                model: option.model,
                messages: [
                    { role: "system", content: option.systemMessage },
                    { role: "user", content: text },
                ],
                ...option.otherParam
            }),
        }
        const data = await GMFetch(option.baseUrl + "/chat/completions", fetchParam, 'json')
        console.log(data)
        return data.choices[0].message.content
    }

    function GMFetch(url, option, formatType) {
        console.log(url, option)
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'GMFetch',
                url: url,
                option: option,
                formatType: formatType
            }, response => {
                if (response.isSuccess) {
                    resolve(response.data)
                } else {
                    reject(response.reason)
                }
            })
        })
    }
})()
