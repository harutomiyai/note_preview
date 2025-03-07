document.addEventListener("click", function (event) {
    let target = event.target.closest("a");
    if (!target || !target.href.includes("note.com")) return;

    if (!target.href.match(/\/n\//)) {
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    let articleUrl = target.href;
    document.body.style.overflow = "hidden";
    let existingPopup = document.getElementById("notePreviewPopup");
    let existingOverlay = document.getElementById("notePreviewOverlay");
    let existingControls = document.getElementById("notePreviewControls");
    if (existingPopup) existingPopup.remove();
    if (existingOverlay) existingOverlay.remove();
    if (existingControls) existingControls.remove();
    function closePreview() {
        popup.remove();
        overlay.remove();
        controls.remove();
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = ""; // スクロールを再有効化
        if (window.history.state && window.history.state.popupOpen) {
            window.history.back();
        }
    }
    function handleEscapeKey(event) {
        if (event.key === "Escape") {
            closePreview();
        }
    }
    document.addEventListener("keydown", handleEscapeKey);
    let overlay = document.createElement("div");
    overlay.id = "notePreviewOverlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(10px);
        z-index: 9998;
    `;
    overlay.onclick = closePreview;
    let popup = document.createElement("div");
    popup.id = "notePreviewPopup";
    popup.style.cssText = `
        position: fixed;
        top: 45%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 70%;
        height: 85%;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    let iframe = document.createElement("iframe");
    iframe.src = articleUrl;
    iframe.sandbox = "allow-scripts allow-same-origin";
    iframe.style.cssText = "width: 100%; height: 100%; border: none; flex-grow: 1; overflow-y: auto;";

    iframe.onload = function () {
        try {
            let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            if (!iframeDoc) {
                console.warn("iframe document not accessible (CORS restrictions). Skipping modifications.");
                return;
            }

            console.log("iframe document loaded");

            function hideExtraSections() {
                let extraItemSections = iframeDoc.querySelectorAll("header, .p-article__extraItemSection.pb-4, .o-othersRecommend, .o-footer__menu, .o-noteContentHeader__status, .o-noteContentHeader__creatorInfo, .o-shareBooster__inner, .o-noteContentHeader__titleAttachment");
                extraItemSections.forEach(section => {
                    section.style.display = "none";
                    console.log("不要なセクションを非表示");
                });
            }
            hideExtraSections();
            let observer = new MutationObserver(() => {
                hideExtraSections();
            });

            observer.observe(iframeDoc.body, { childList: true, subtree: true });
            iframeDoc.addEventListener("click", function (e) {
                let link = e.target.closest("a");
                if (link && !link.href.includes("note.com")) {
                    e.preventDefault();
                    window.open(link.href, "_blank");
                }
            });
        } catch (error) {
            console.error("Error accessing iframe content:", error);
        }
    };
    let controls = document.createElement("div");
    controls.id = "notePreviewControls";
    controls.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 45%;
        right: auto;
        display: flex;
        gap: 15px;
        z-index: 10000;
    `;

    function createSvgButton(svgFileName, action) {
        let button = document.createElement("button");
        let img = document.createElement("img");
    
        img.src = chrome.runtime.getURL(svgFileName);
        img.width = 24;
        img.height = 24;
        img.alt = "Button Icon";
    
        button.appendChild(img);
        button.style.cssText = `
            width: 48px;
            height: 48px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            transition: background 0.3s ease, opacity 0.2s ease-in-out;
        `;
        button.onmouseover = () => button.style.background = "rgba(0, 0, 0, 0.8)"; // ここを好きな色に変更！
        button.onmouseout = () => button.style.background = "rgba(0, 0, 0, 0.8)";
        button.onclick = action;
        return button;
    }
    let openButton = createSvgButton("spread.svg", () => window.location.href = articleUrl);
    let closeButton = createSvgButton("close.svg", closePreview);
    

    controls.appendChild(openButton);
    controls.appendChild(closeButton);

    document.body.appendChild(overlay);
    document.body.appendChild(controls);
    popup.appendChild(iframe);
    document.body.appendChild(popup);

    window.history.pushState({ popupOpen: true, prevUrl: window.location.href }, "", "#notePreview");

    window.addEventListener("popstate", function (event) {
        if (!event.state || !event.state.popupOpen) {
            closePreview();
        }
    });

}, true);

document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();

        let openButton = document.querySelector("#notePreviewControls button:first-child");
        if (openButton) {
            openButton.click();
        }
    }
});

