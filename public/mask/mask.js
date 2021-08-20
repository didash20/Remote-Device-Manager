const instrument = document.getElementById('instrument');
const popup = document.getElementById('popup');
const serverport = 9000;

const dates = JSON.parse(getMeta('dates'));

let popupclosed = false;

let source = window.location.href;
const portindex = source.slice(7).indexOf('/') + 7;
source = source.slice(0,portindex)+':'+serverport+source.slice(portindex);
instrument.src = source;

const checkExpiration = setInterval(function(){
    let timedif = new Date(dates.dateExpiring);
    timedif -= new Date();
    
    if(timedif<0){
        instrument.remove();
        location.reload();
    }
    else if(timedif<5*60*1000 && popupclosed === false){
        
        popup.style.display = "block";

        /* Alert if browser is internet explorer */
        if (window.navigator.userAgent.includes("MSIE"))
        {
            alert('The connection will expire in less than 5 minutes.\n' +
                'Remember to log or save data before the session expires.');
        }
    }

},30000);

function popup_close () {
    popup.style.display = "none";
    popupclosed = true;
}