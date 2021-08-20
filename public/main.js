window.addEventListener('load', function() {
    const sidebaroption = document.getElementById(getMeta('active-menu'));
    if(sidebaroption)
        sidebaroption.className += " active";
});

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');

    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === metaName) {
            return metas[i].getAttribute('content');
        }
    }
    return '';
}

const catchError = function (err) {
    console.error('oops', err);
    alert('An Network Error ocurred\nTry again later.')
}