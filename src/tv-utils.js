export const calcTvCanvasSize = () => {
    const tvImage = document.getElementById('tv-image');
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    const imageWidth = tvImage?.clientWidth || Math.max(Math.floor(viewportWidth * 0.76), 320);
    const imageHeight = tvImage?.clientHeight || Math.max(Math.floor(viewportHeight * 0.7), 220);

    const canvasWidth = Math.max(1, Math.floor(imageWidth * 0.85));
    const canvasHeight = Math.max(1, Math.floor(imageHeight * 0.45));

    return { width: canvasWidth, height: canvasHeight };
};