/**
 * Device dpi.
 */
let dpi = window.devicePixelRatio;

/**
 * slideshow mode controller.
 */
let slideshowController = new function () {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /*_______________________________________
    |   HTML related methods
    */

    // On document content load
    document.addEventListener("DOMContentLoaded", function (e) {

    });

    window.onload = () => {
        // Makes page content visible
        document.getElementById("page-container").classList.add("visible");
        document.getElementById("page-container").classList.remove("hidden");

        setTimeout(() => {
            // Removes the spinning loader
            document.getElementById("loading-container").classList.add("transparent")
            setTimeout(() => {
                document.getElementById("loading-container").remove();
            }, 400);

            // Makes page content visible
            document.getElementById("page-container").classList.remove("transparent");
        }, 1000);
    }

    /* ------ Page visibility ------ */

    /**
     * Temporarily hides the page container to perform an action.
     * @param {Function} action Function to execute while the page container is not visible.
     * @param {Number} hidingDuration Hiding duration in ms.
     */
    function hidePageContainerTemporarily(action, hidingDuration) {
        // Hides the page container
        document.getElementById("page-container").classList.add("transparent");

        // Styles the page size slider and the page container
        setTimeout(() => {
            action();
        }, hidingDuration);
        // Displays the page container
        setTimeout(() => {
            document.getElementById("page-container").classList.remove("transparent")
        }, hidingDuration * 2);
    }

    return publicAPIs;
}