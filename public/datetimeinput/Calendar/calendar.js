//Create Custom Calendar element
class Calendar extends HTMLElement {
    render() {
        //Create a shadow dom
        const shadow = this.attachShadow({mode: 'open'});

        //Apply external style to the shadow dom
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel','stylesheet');
        linkElem.setAttribute('href','/datetimeinput/Calendar/calendar.css');

        //Attach the created element to the shadow dom
        shadow.appendChild(linkElem);

        //Create Month overview and change month buttons
        const month = document.createElement('div');
        month.setAttribute('class','month');
        const monthWrapper = document.createElement('ul');

        this.prevMonth = document.createElement('li');
        this.prevMonth.setAttribute('class','button prev dis');
        this.prevMonth.onclick = function(){};
        this.prevMonth.innerHTML = '&#10094;'

        this.nextMonth = document.createElement('li');
        this.nextMonth.setAttribute('class','button next');
        this.nextMonth.onclick = function(){};
        this.nextMonth.innerHTML = '&#10095;'

        const monthtxtWrapper = document.createElement('li');
        this.monthtxt = document.createElement('span');
        this.monthtxt.innerText = 'July';
        this.yeartxt = document.createElement('span');
        this.yeartxt.innerText = '2020';

        //Append Elements to the shadow dom
        shadow.appendChild(month);
        month.appendChild(monthWrapper);
        monthWrapper.appendChild(this.prevMonth);
        monthWrapper.appendChild(this.nextMonth);
        monthWrapper.appendChild(monthtxtWrapper);
        monthtxtWrapper.appendChild(this.monthtxt);
        monthtxtWrapper.appendChild(document.createElement('br'));
        monthtxtWrapper.appendChild(this.yeartxt);

        //Create weekdays overview
        const weekdaysArray = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        const weekdays = document.createElement('table');
        weekdays.setAttribute('class','weekdays');
        const weekdaysWrapper = document.createElement('tr');
        weekdaysArray.forEach( weekdaystr => {
            const weekday = document.createElement('td');
            weekday.innerText = weekdaystr;
            weekdaysWrapper.appendChild(weekday);
        });

        //Append weekdays into shadow dom
        shadow.appendChild(weekdays);
        weekdays.appendChild(weekdaysWrapper);

        //Create days overview
        this.daylist = document.createElement('table');
        this.daylist.setAttribute('class','days');
        for(let row=0; row<6; row++)
        {
            const week = document.createElement("tr");
            this.daylist.appendChild(week);
            for(let col=0; col<7; col++)
            {
                const day = document.createElement("td");
                day.addEventListener("click", e=> {
                    this.activateElement(row*7+col);
                },false);
                week.appendChild(day);
                const numcont = document.createElement("div");
                numcont.setAttribute('class','numcont');
                day.appendChild(numcont);
                const spots = document.createElement("div");
                spots.setAttribute('class','spots');
                spots.innerHTML = "<span class='nspots'>24</span> SPOTS";
                day.appendChild(spots);
            }
        }

        //Append days into shadow dom
        shadow.appendChild(this.daylist);

        //Create ending
        const end = document.createElement('div');
        end.setAttribute('class','end');
        
        shadow.appendChild(end);
    }

    constructor() {
        //Call the HTMLElement constructor
        super();

        //Render all the elements into the shadow dom
        this.render();

        if(this.hasAttribute('Date'))
            this.activedate = new Date(this.getAttribute('Date'));
        else{
            this.activedate = new Date();

            this.activedate.setHours(0);
            this.activedate.setMinutes(0);
            this.activedate.setSeconds(0);
            this.activedate.setMilliseconds(0);

            this.setAttribute('date',this.activedate);
        }

        this.year = this.activedate.getFullYear();
        this.month = this.activedate.getMonth();
        this.day = this.activedate.getDate();

        this.strmonth = this.sMonth(this.month);
        this.numdays = this.nDaysMonth(this.year,this.month);

        this.first_weekday = new Date(this.year,this.month).getDay();

        if(this.hasAttribute('min'))
            this.min = new Date(this.getAttribute('min'));
        else
            this.min = new Date(this.activedate);

        if(this.hasAttribute('max'))
            this.max = new Date(this.getAttribute('max'));
        else
            this.max = new Date(this.year,this.month+2,this.day-1);

        this.datesbooked = {
            dates: [],
            numdates: 0
        }

        this.fillDays();
        this.activateElement(this.first_weekday+this.activedate.getDate()-1);
        this.changeMonth(0);

    }

    changeYear(increase) {
        this.year += increase;
        this.month %= 12;
        this.month += this.month>=0? 0:12;
    }

    changeMonth(increase) {
        this.month += increase;

        if(this.month>11)
            this.changeYear(Math.floor(this.month/12)); 
        else if(this.month<0)
            this.changeYear(Math.floor((this.month+1)/12)-1); 

        this.strmonth = this.sMonth(this.month);
        this.first_weekday = new Date(this.year,this.month).getDay();
        this.numdays = this.nDaysMonth(this.year,this.month);
        this.fillDays();

        if(this.month === this.activedate.getMonth())
            this.activateElement(this.active_element);
        else
            this.deactivateElement();

        
        if(this.month+1 > this.max.getMonth() && this.year+1 > this.max.getFullYear()){
            this.nextMonth.className = "button next dis";
            this.nextMonth.onclick = function(){};
        }
        else{
            this.nextMonth.className = "button next";
            this.nextMonth.onclick = () => {this.changeMonth(1)};
        }

        if(this.month-1 < this.min.getMonth() && this.year-1 < this.min.getFullYear()){
            this.prevMonth.className = "button prev dis";
            this.prevMonth.onclick = function(){};
        }
        else{
            this.prevMonth.className = "button prev";
            this.prevMonth.onclick = () => {this.changeMonth(-1)};
        }
    }

    sMonth(month) {
        switch(month)
        {
            case 0: return "January"; 
            case 1: return "February"; 
            case 2: return "March"; 
            case 3: return "April"; 
            case 4: return "May"; 
            case 5: return "June"; 
            case 6: return "July"; 
            case 7: return "August"; 
            case 8: return "September"; 
            case 9: return "October"; 
            case 10: return "November"; 
            case 11: return "December"; 
            default: return undefined;
        }
    }

    nDaysMonth(year,month) {
        switch(month)
        {
            case 0: case 2: case 4: 
            case 6: case 7: case 9: 
            case 11: return 31;

            case 3: case 5: case 8:
            case 10: return 30;

            case 1: return (year%4==0)? 29:28;

            default: return undefined;
        }
    }

    fillDays() {
        this.monthtxt.innerHTML = this.strmonth;
        this.yeartxt.innerHTML = this.year;
        const daylist = this.daylist.getElementsByTagName("td");
        for(let element=0; element<42; element++)
        {
            let numcont = daylist[element].getElementsByTagName("div")[0];
            if(element < this.first_weekday)
            {
                daylist[element].className = "prev";
                numcont.innerHTML = "";
            }
            else if(element < this.first_weekday + this.numdays)
            {
                const day = 1+element-this.first_weekday;
                const date = new Date(this.year,this.month,day);
                const UTCcheckdate = new Date(date.getTime()-date.getTimezoneOffset()*60000);
                UTCcheckdate.setUTCHours(0);
                UTCcheckdate.setUTCMinutes(0);
                UTCcheckdate.setUTCMilliseconds(0);
        
                const hourdifference = UTCcheckdate.getTimezoneOffset()/60;
                const UTCdifference = (hourdifference<0)?-1:0;

                const prevbooked_date = this.datesbooked.dates.find(d => d.date.getTime() === (UTCcheckdate.getTime()+UTCdifference*24*3600*1000));
                const booked_date = this.datesbooked.dates.find(d => d.date.getTime() === (UTCcheckdate.getTime()+(UTCdifference+1)*24*3600*1000));

                const prevbookdatehournum = prevbooked_date?prevbooked_date.hours.filter(hour=>hour>=hourdifference).length:0;
                const bookdatehournum = booked_date?booked_date.hours.filter(hour=>hour<hourdifference).length:0;

                const totalhournum = prevbookdatehournum + bookdatehournum;

                if(date >= this.min && date <= this.max && 
                  ( !booked_date || totalhournum !== 24)){
                    daylist[element].className = "available";
                    daylist[element].querySelector('.nspots').innerHTML = 24 - totalhournum;
                }
                else{
                    daylist[element].className = "unavailable";
                }
                numcont.innerHTML = day;
            }
            else
            {
                daylist[element].className = "next";
                numcont.innerHTML = "";
            }
        }
        
    }

    activateElement(element) {
        let dayelement = this.daylist.getElementsByTagName("td")[element];
        if(dayelement.className == "available")
        {
            if(this.active_element !== undefined)
                this.daylist.getElementsByTagName("td")[this.active_element]
                    .getElementsByTagName("div")[0].id = "";
            dayelement.getElementsByTagName("div")[0].id = "active";
            
            this.active_element = element;
            this.day = element-this.first_weekday+1;

            this.activateDate();
        }
    }

    deactivateElement() {
        this.daylist.getElementsByTagName("td")[this.active_element]
                    .getElementsByTagName("div")[0].id = "";
    }

    activateDate() {
        this.activedate.setFullYear(this.year);
        this.activedate.setMonth(this.month);
        this.activedate.setDate(this.day);
        this.activedate.setHours(0);

        this.setAttribute('date',this.activedate);

        const event = new CustomEvent('changed', {detail: this.activedate});
        this.dispatchEvent(event);
    }

    getActiveDate() {
        return this.activedate;
    }

    setDatesBooked(dates) {
        this.datesbooked = dates;
        this.fillDays();
    }
}
customElements.define('input-calendar',Calendar);

//export {Calendar};