class DateTimeInput extends HTMLElement {
    render() {

        //Create a shadow dom
        const shadow = this.attachShadow({mode: 'open'});

        shadow.innerHTML =
        `<link rel="stylesheet" href="/datetimeinput/datetimeinput.css">
        <form class="userdialog" id="schedule-form">
            <h1 id="title">Book your instrument</h1>
            <ul>
                <li id="calendar"></li>
                <li id="time"></li>
                <li id="inputcontainer">
                    <label for="date">date: </label>
                    <input type="datetime-local" id="date" name="date" readonly>
                </li>
                <li id="button">
                    <input type="submit" value="SUBMIT" class="submit" id="submit"></button>
                </li>
            </ul>
        </form>
        <div class="overlay"></div>`

        shadow.querySelector('.overlay').addEventListener('click', ev => {
            this.parentNode.removeChild(this);
        },false);

        this.calendarinput = new Calendar();
        this.timeinput = new Time();

        const calendar = shadow.getElementById("calendar");
        const time = shadow.getElementById("time");
        this.submit = shadow.getElementById("submit");

        calendar.appendChild(this.calendarinput);
        time.appendChild(this.timeinput);
    }

    constructor() {

        super();

        this.render();

        if(this.hasAttribute('min'))
            this.min = new Date(this.getAttribute('min'));
        else
            this.min = new Date();

        if(this.hasAttribute('max'))
            this.max = new Date(this.getAttribute('max'));
        else
            this.max = new Date(this.min.getFullYear(),this.min.getMonth()+2,this.min.getDate()-1);

        this.calendarinput.addEventListener('click', ()=> {
            this.timeinput.setActiveDate(this.calendarinput.getActiveDate());
        });

        this.setBookedDates(this.getTestDates());
        this.Init();
    }

    Init() {

        const updateDateInput = (date) => {
            const dateinput = this.shadowRoot.getElementById("date");
            dateinput.setAttribute('value',
                "" + date.getFullYear() + 
                "-" + ("0" + (date.getMonth()+1)).slice(-2) + 
                "-" + ("0" + (date.getDate())).slice(-2) + 
                "T" + ("0" + (date.getHours())).slice(-2) + 
                ":" + ("0" + (date.getMinutes())).slice(-2));
        }

        this.calendarinput.addEventListener('changed', e => {
            this.timeinput.setActiveDate(e.detail);
            updateDateInput(e.detail);
        },false);
        
        this.timeinput.addEventListener('changed', e => {
            updateDateInput(e.detail)
        },false);
    }

    setTitle(title) {
        const title_element = this.shadowRoot.getElementById("title");
        title_element.innerText = title
    }

    setSubmitFunction(callback = function(){}) {
        this.submit.addEventListener('click', ev => {
            ev.preventDefault();
            arguments[0] = this.timeinput.getActiveDate();
            callback.apply(null,arguments);
            this.parentNode.removeChild(this);
        });
    }

    setFormAction(action = "", method="get") {
        const form = this.shadowRoot.getElementById('schedule-form');
        form.setAttribute('action',action);
        form.setAttribute('method',method);
    }

    setExtraInputs( inputs = { resource: 'Measurements Live'}) {
    
        const inputcontainer = this.shadowRoot.getElementById('inputcontainer');

        for(let input in inputs){
            const br = document.createElement('br');
            const labelelement = document.createElement('label');
            const inputelement = document.createElement('input');
    
            labelelement.setAttribute('for',input);
            labelelement.innerText = ' ' + input + ':  ';
    
            inputelement.setAttribute('type','text');
            inputelement.setAttribute('id',input);
            inputelement.setAttribute('name',input);
            inputelement.setAttribute('value',inputs[input]);
            inputelement.setAttribute('readonly','');
    
            inputcontainer.appendChild(br);
            inputcontainer.appendChild(labelelement);
            inputcontainer.appendChild(inputelement);
        }
    }

    getTestDates() {
        let allhours = [];
    
        for(let i=0;i<24;i++)
            allhours.push(i);

        const currentUTCdate = new Date();
        currentUTCdate.setUTCHours(0);
        currentUTCdate.setUTCMinutes(0);
        currentUTCdate.setUTCSeconds(0);
        currentUTCdate.setUTCMilliseconds(0);

        const day = 24*3600*1000;
    
        let date1 = {
            date: new Date(currentUTCdate.getTime()+1*day),
            hours: [0,4,5,10,14,20],
            numhours: 6
        },
            date2 = {
            date: new Date(currentUTCdate.getTime()+3*day),
            hours: [5,6,9,13,15],
            numhours: 5
        },
            date3 = {
            date: new Date(currentUTCdate.getTime()+6*day),
            hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,14,18,22],
            numhours: 16
        },
            date4 = {
            date: new Date(currentUTCdate.getTime()+15*day),
            hours: allhours,
            numhours: allhours.length
        },
            date5 = {
            date: new Date(currentUTCdate.getTime()+16*day),
            hours: allhours,
            numhours: allhours.length
        };
        
        let dates = [date1,date2,date3,date4,date5];
    
        return {
            dates: dates,
            numdates: dates.length
        }
    }

    getUnavailableHours() {

        const   currentdate = new Date(),
            currentUTCHour = currentdate.getUTCHours();
        currentdate.setUTCHours(0);
        currentdate.setMinutes(0);
        currentdate.setSeconds(0);
        currentdate.setMilliseconds(0);
        
        let hours = [];
        for(let i=0;i<24;i++)
            hours.push(i);
        
        let dates = [];
    
        while(this.min.getTime()>currentdate.getTime()){
    
            dates.push(
                {
                    date: new Date(Date.UTC(currentdate.getFullYear(),currentdate.getMonth(),currentdate.getDate())),
                    hours: hours,
                    numhours: hours.length
                }
            );
    
            currentdate.setDate(currentdate.getDate()+1);
        }

    
        hours = [];
        for(let i=0;i<currentUTCHour;i++)
            hours.push(i);
    
        while(this.min.getUTCHours()>currentUTCHour){
            hours.push(currentUTCHour);
            currentUTCHour++;
        }
    
        dates.push(
            {
                date: new Date(Date.UTC(currentdate.getFullYear(),currentdate.getMonth(),currentdate.getDate())),
                hours: hours,
                numhours: hours.length
            }
        );
    
        return {
            dates: dates,
            numdates: dates.length
        }
    }

    concatDatesBooked(booked_dates1,booked_dates2) {

        booked_dates2.dates.forEach( bookeddate2 => {
            bookeddate2.date = new Date(bookeddate2.date);
            const samebookeddate = booked_dates1.dates.find( bookeddate1 => bookeddate1.date.getTime() === bookeddate2.date.getTime());

            if(samebookeddate === undefined){
                booked_dates1.dates.push(bookeddate2);
            }
            else{

                bookeddate2.hours.forEach( hour2 => {
                    const samehour  = samebookeddate.hours.find(hour => hour === hour2);

                    if(samehour === undefined){
                        samebookeddate.hours.push(hour2)
                    }
                });

                samebookeddate.numhours = samebookeddate.hours.length;
            }
        });

        booked_dates1.dates.sort(function(date1,date2){
            return date1.date.getTime() - date2.date.getTime();
        });

        booked_dates1.numdates = booked_dates1.dates.length;

        return booked_dates1;
    }

    load() {
        this.timeinput.load();
    }

    setBookedDates(datesbooked) {
        const db = this.concatDatesBooked(this.getUnavailableHours(new Date()),datesbooked);

        this.calendarinput.setDatesBooked(db);
        this.timeinput.setDatesBooked(db);
    }

}customElements.define('userdialog-datetime',DateTimeInput);


const calendarscript = document.createElement('script');
calendarscript.setAttribute('type','text/javascript');
calendarscript.setAttribute('src','/datetimeinput/Calendar/calendar.js')

document.head.appendChild(calendarscript);


const timescript = document.createElement('script');
timescript.setAttribute('type','text/javascript');
timescript.setAttribute('src','/datetimeinput/Time/time.js')

document.head.appendChild(timescript);