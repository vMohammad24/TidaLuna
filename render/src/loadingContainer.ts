export const getOrCreateLoadingContainer = () => {
    const containerStyles: Partial<CSSStyleDeclaration> = {
        position: "absolute",
        zIndex: "-1",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: "1",
        transition: "opacity 1s ease-out",
    };

    const messageStyles: Partial<CSSStyleDeclaration> = {
        position: "absolute",
        top: "100%",
    };

    let loadingContainer = document.getElementById("tidaluna-loading") as HTMLDivElement | null;
    let messageContainer: HTMLDivElement;

    if (!loadingContainer) {
        loadingContainer = document.createElement("div");
        loadingContainer.id = "tidaluna-loading";
        Object.assign(loadingContainer.style, containerStyles);

        const title = document.createElement("h1");
        title.innerHTML = `Loading Tida<b><span style="color: #31d8ff;">Luna</span></b>...`;
        loadingContainer.appendChild(title);

        messageContainer = document.createElement("div");
        messageContainer.id = "tidaluna-loading-text";
        Object.assign(messageContainer.style, messageStyles);
        loadingContainer.appendChild(messageContainer);

        document.body.appendChild(loadingContainer);
    } else {
        messageContainer = loadingContainer.querySelector<HTMLDivElement>("#tidaluna-loading-text")!;
    }

    return { loadingContainer, messageContainer };
};