var halla = (function () {
    function halla() {
        this.name = "hello";
    }
    return halla;
}());
var hi = new halla();
console.log(hi.name);
