function proceed() {
    const httpReq = new XMLHttpRequest();
    httpReq.open("POST", "/continue", true);
    httpReq.send();
}