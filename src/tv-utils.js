const calcTvCanvasSize = () => {
    const tvImage = document.getElementById('tv-image');
    // const canvasWidth = Math.floor(tvImage.clientWidth * 0.72);
    // const canvasHeight = Math.floor(tvImage.clientHeight * 0.33);
    const canvasWidth = Math.floor(tvImage.clientWidth * 0.85);
    const canvasHeight = Math.floor(tvImage.clientHeight * 0.45);

    return { width: canvasWidth, height: canvasHeight };
};