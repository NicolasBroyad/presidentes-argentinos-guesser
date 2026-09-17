(function () {
    try {
        var tema = localStorage.getItem('pag-theme');
        if (tema === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch (e) {}
})();
