class ScrollWrapper extends HTMLElement {
    render() {

        this.setAttribute('class','scrollWrapper');

        //Create a shadow dom
        const shadow = this.attachShadow({mode: 'open'});
        this.wrapper = document.createElement('ul');

        //Append Elements to the shadow dom
        shadow.appendChild(this.wrapper);

        //Apply external style to the shadow dom
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel','stylesheet');
        linkElem.setAttribute('href','/datetimeinput/Time/time.css');

        //Attach the created element to the shadow dom
        shadow.appendChild(linkElem);

    }

    constructor() {
        super();

        this.render();

        this.elementactive = 0;

        this.elements = this.shadowRoot.querySelectorAll('li');
        this.extras = this.shadowRoot.querySelectorAll('.extra');

        this.scrolling = false;
        this.loop = true;

        this.scrollerInit();
    }

    getScrollerPos() {
        return Math.round((this.pageYOffset || this.scrollTop) - (this.clientTop || 0));
    }

    setScrollerPos(pos) {
        this.scrollTop = pos;
    }

    getExtrasHeight() {
        let height = 0;
    
        this.extras.forEach( extra => {
            height += extra.clientHeight; 
        });
    
        return height;
    }

    getElementsHeight() {
        let height = 0;
    
        this.elements.forEach( element => {
            height += elements.clientHeight; 
        });
    
        return height;
    }

    reCalcScroll() {
        
        this.elementslength = (this.elements.length-this.extras.length);
        this.elementheight = this.elements[0].clientHeight;
        this.elementsheight = this.elementslength*this.elementheight;
        this.scrollervisible = this.clientHeight;
        this.scrollerheight = this.scrollHeight;
        this.elementoffset = (this.scrollervisible/this.elementheight-1)/2;

        const scrollerpos = this.getScrollerPos();
        this.extrasheight = this.getExtrasHeight();
    
        if(scrollerpos <= 0){
            this.setScrollerPos(1);
        }

        /*console.log(`
        elementslength = ${this.elementslength}
        elementheight = ${this.elementheight}
        elementsheight = ${this.elementsheight}
        scrollervisible = ${this.scrollervisible}
        scrollerheight = ${this.scrollerheight}
        elementoffset = ${this.elementoffset}
        scrollerpos = ${scrollerpos}
        extrasheight = ${this.extrasheight}`);*/

        if(this.elementheight)
            return false;
        else
            return true;
    }

    updateColors() {

        const scrollerpos = this.getScrollerPos();

        let el = Math.round((scrollerpos+this.elementoffset*this.elementheight)/this.elementheight);
        
        this.elements.forEach( (element,index) => {
            if(this.isElementAvailable(index) && index === el){
                element.id = 'active';
            }
            else{
                element.id = '';
            }
        });

    }

    scrollerUpdate() {
    
        const scrollerpos = this.getScrollerPos();

        if(this.loop){
            if(this.elementsheight + scrollerpos >= this.scrollerheight + 1){
                this.setScrollerPos(2);
            }
            else if(scrollerpos <= 1) {
                this.setScrollerPos( this.scrollerheight - this.elementsheight);
            }
        }
        
        this.updateColors();
            
    
    }

    scrollToElement(element,period,auto=true,up=true) {
        
        let scrollerpos = this.getScrollerPos();
        let newscrollerpos = Math.round((element-this.elementoffset)*this.elementheight);

        while(!this.isElementAvailable(element)){
            if((auto&&newscrollerpos>scrollerpos)||(!auto&&up))
                element++;
            else if((auto&&newscrollerpos<scrollerpos)||(!auto&&!up))
                element--;
            if( element < 0 || element >= this.elements.length){
                this.scrollerFinished(false);
                return false;
            }
        }

        newscrollerpos = Math.round((element-this.elementoffset)*this.elementheight);

        if(this.loop){
            if(this.elementsheight + newscrollerpos >= this.scrollerheight + 1){
                element -= this.elementslength;
            }
            else if(newscrollerpos <= 1) {
                element += this.elementslength;
            }
        }
        
        let timercleared = false;
        const timer = setInterval(()=>{
            if((newscrollerpos+this.elementsheight)%(this.elementsheight)===scrollerpos){
                clearInterval(timer);
                timercleared = true;
            }
            else if((auto&&newscrollerpos>scrollerpos)||(!auto&&up)){
                scrollerpos += 1;
            }
            else if((auto&&newscrollerpos<scrollerpos)||(!auto&&!up)){
                scrollerpos -= 1;
            }
            this.setScrollerPos(scrollerpos);
            this.scrollerUpdate();
            if(scrollerpos<0||scrollerpos>this.elementsheight)
                scrollerpos = this.getScrollerPos();
        },period);

        setTimeout( () => {
            if(!timercleared){
                clearInterval(timer);
            }
        },1000);
        
        this.elementactive = element;
    
    }

    isElementAvailable(element){
        return this.elements[element%this.elementslength].className === "available";
    }

    scrollerFinished(force=false) {

        const scrollerpos = this.getScrollerPos();

        if((scrollerpos + this.elementoffset*this.elementheight)%this.elementheight !== 0 || force){

            let element = Math.round((scrollerpos+this.elementoffset*this.elementheight)/this.elementheight);
            let offset = 0;

            if(isNaN(element))
                return false;

            while(!this.isElementAvailable(element)){
                if(this.isElementAvailable(element+offset) )
                    element += offset;
                else if(element>=offset && this.isElementAvailable(element-offset))
                    element -= offset;
                else
                    offset++;
                
                if(element-offset<0 && element+offset>=this.elements.length)
                    return false;
            }
        
            this.scrollToElement(element,2,true);
        }
    }

    scrollerInit() {

        let timer;

        this.addEventListener('scroll', () => {

            if(window.innerWidth <= 800){
                    
                this.scrollerUpdate();

                if(timer === undefined)
                    timer = null;
                else if(timer !== null){
                    clearTimeout(timer);
                    this.scrolling = true;
                }

                timer = setTimeout( () => {
                    this.scrollerFinished(false);
                    this.scrolling = false;
                },150);
            }
        },false);

        this.addEventListener('wheel', (ev) => {

            if(ev.deltaY%100===0&&ev.deltaY!==0){

                ev.preventDefault();

                let element = this.elementactive;

                if(ev.deltaY>0)
                    element++;
                else
                    element--;

                this.scrollToElement(element,2,false,ev.deltaY>0);
            }
            else{

                this.scrollerUpdate();
    
                if(timer === undefined)
                    timer = null;
                else if(timer !== null){
                    clearTimeout(timer);
                    this.scrolling = true;
                }
    
                timer = setTimeout( () => {
                    this.scrollerFinished(false);
                    this.scrolling = false;
                },150);
                
            }

        },false);
    
        this.elements.forEach((element,index) => {
            element.addEventListener('click', () => {
                if(!this.scrolling&&this.isElementAvailable(index)){
                    this.scrollToElement(index,2,true);
                }
            });
        });

    }

    getElementActive(){
        return this.elementactive;
    }

    setElementActive(element){

        let newscrollerpos = (element-this.elementoffset)*this.elementheight;

        newscrollerpos += newscrollerpos<=0?this.elementsheight:0;

        this.setScrollerPos(newscrollerpos);
        this.elementactive = element;
        this.scrollerFinished(true);
    }

}customElements.define('custom-scrollwrapper',ScrollWrapper);

class HourScroller extends ScrollWrapper {
    render() {

        super.render();

        for(let i=0;i<12;i++){
            const element = document.createElement('li');
            element.setAttribute('class','available');
            element.innerHTML = i==0?12:i;
            this.wrapper.appendChild(element);
        }

        for(let i=0;i<12;i++){
            const extra = document.createElement('li');
            extra.setAttribute('class','available extra');
            extra.innerHTML = i==0?12:i;
            this.wrapper.appendChild(extra);
        }

    }

    constructor() {

        super();

    }
    
    fillHours(booked_dates,date,period) {
        
        const hourlist = this.wrapper.getElementsByTagName("li");
        const UTCcheckdate = new Date(date.getTime()-date.getTimezoneOffset()*60000);
        UTCcheckdate.setUTCHours(0);
        UTCcheckdate.setUTCMinutes(0);
        UTCcheckdate.setUTCSeconds(0);
        UTCcheckdate.setUTCMilliseconds(0);

        const hourdifference = UTCcheckdate.getTimezoneOffset()/60;
        
        for(let hour=0; hour<hourlist.length/2; hour++)
        {
            const p = period?12:0;
            const day = (hour+hourdifference+p<0)?-1:(hour+hourdifference+p)>=24?1:0;
            const booked_date = booked_dates.dates.find(d => d.date.getTime() === (UTCcheckdate.getTime()+day*24*3600*1000));

            const newhour = (hour+p+hourdifference+24)%24;
            const booked_hour = (booked_date)? booked_date.hours.find(h => h === newhour):undefined;

            if(booked_hour === undefined){
                hourlist[hour].className = "available";
                hourlist[hour+this.elementslength].className = "available";
            }
            else{
                hourlist[hour].className = "unavailable";
                hourlist[hour+this.elementslength].className = "unavailable";
            }
        }

        this.updateColors();
    }

    getHour() {
        return this.getElementActive()%12;
    }

    setHour(hour){
        this.setElementActive(hour);
    }

}customElements.define('custom-hourscroller',HourScroller);

class PeriodScroller extends ScrollWrapper {
    render() {

        super.render();

        for(let i=0;i<5;i++){
            const extra = document.createElement('li');
            extra.setAttribute('class','unavailable');
            extra.innerHTML = '<br>';
            this.wrapper.appendChild(extra);
        }
        
        const am = document.createElement('li');
        am.setAttribute('class','available');
        am.innerHTML = 'AM';
        this.wrapper.appendChild(am);

        const pm = document.createElement('li');
        pm.setAttribute('class','available');
        pm.innerHTML = 'PM';
        this.wrapper.appendChild(pm);

        for(let i=0;i<5;i++){
            const extra = document.createElement('li');
            extra.setAttribute('class','unavailable');
            extra.innerHTML = '<br>';
            this.wrapper.appendChild(extra);
        }

    }

    constructor() {

        super();
        this.loop = false;

    }

    fillPeriod(booked_dates,date) {
        const periodlist = this.wrapper.getElementsByTagName("li");
        const UTCcheckdate = new Date(date.getTime()-(new Date().getTimezoneOffset())*60000);
        UTCcheckdate.setUTCHours(0);
        UTCcheckdate.setUTCMinutes(0);
        UTCcheckdate.setUTCSeconds(0);
        UTCcheckdate.setUTCMilliseconds(0);

        const hourdifference = UTCcheckdate.getTimezoneOffset()/60;

        let AMempty= true;
        let PMempty= true;
        
        for(let hour=0; hour<24; hour++)
        {
            const day = (hour+hourdifference<0)?-1:(hour+hourdifference>=24)?1:0;
            const booked_date = booked_dates.dates.find(d => d.date.getTime() === (UTCcheckdate.getTime()+day*24*3600*1000));

            const newhour = (hour+hourdifference+24)%24;

            if(hour<12 && (booked_date === undefined || !booked_date.hours.includes(newhour))){
                AMempty = false
            }
            else if(booked_date === undefined || !booked_date.hours.includes(newhour)){
                PMempty = false
            }

        }

        if(!AMempty)
            periodlist[5].className = "available";
        else
            periodlist[5].className = "unavailable";
        if(!PMempty)
            periodlist[6].className = "available";
        else
            periodlist[6].className = "unavailable";
        
    }

    getPeriod() {
        return this.getElementActive()-5;
    }

    setPeriod(period){
        this.setElementActive(period+5);
    }

}customElements.define('custom-periodscroller',PeriodScroller);

//Create Custom Calendar element
class Time extends HTMLElement {
    render() {

        //Create a shadow dom
        const shadow = this.attachShadow({mode: 'open'});
        
       //Apply external style to the shadow dom
       const linkElem = document.createElement('link');
       linkElem.setAttribute('rel','stylesheet');
       linkElem.setAttribute('href','/datetimeinput/Time/time.css');

       //Attach the created element to the shadow dom
       shadow.appendChild(linkElem);
       

        //Create top
        const top = document.createElement('div');
        top.setAttribute('class','top');
        
        shadow.appendChild(top);

        const wrapper = document.createElement('div');
        wrapper.setAttribute('class','timeWrapper');
        
        this.hourscroller = new HourScroller();
        this.periodscroller = new PeriodScroller();
        
        //Append Elements to the shadow dom
        shadow.appendChild(wrapper);
        wrapper.appendChild(this.hourscroller);
        wrapper.appendChild(this.periodscroller);

        //Create bottom
        const bottom = document.createElement('div');
        bottom.setAttribute('class','bottom');
        
        shadow.appendChild(bottom);

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

            this.activedate.setMinutes(0);
            this.activedate.setSeconds(0);
            this.activedate.setMilliseconds(0);

            this.setAttribute('date',this.activedate);
        }

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

        this.hour = this.activedate.getHours()%12;
        this.period = this.activedate.getHours()<12?0:1;

        this.Init();

    }

    sPeriod(period) {
        switch(period)
        {
            case 0: return "AM"; 
            case 1: return "PM"; 
            default: return undefined;
        }
    }

    getActiveTime() {
        return (this.hour%12 + (this.period?12:0))%24;
    }

    getActiveDate() {
        this.updateActiveDate();
        this.activedate.setHours(this.getActiveTime());
        return this.activedate;
    }

    setActiveDate(date) {
        this.activedate = date;
        
        this.periodscroller.fillPeriod(this.datesbooked,this.activedate);
        this.periodscroller.setPeriod(this.period);
        this.period = this.periodscroller.getPeriod();

        this.hourscroller.fillHours(this.datesbooked,this.activedate,this.period);
        this.hourscroller.setHour(this.hour);
        this.hour = this.hourscroller.getHour();

        this.activedate.setHours(this.getActiveTime());

    }

    setActivePeriod() {
        this.hourscroller.fillHours(this.datesbooked,this.activedate,this.period);
        this.hourscroller.scrollerFinished(true);
        this.updateActiveDate();
    }

    updateActiveDate() {
        this.hour = this.hourscroller.getHour();
        this.period = this.periodscroller.getPeriod();
        this.activedate.setHours(this.getActiveTime());
        this.setAttribute('date',this.activedate);
        const event = new CustomEvent('changed', {detail: this.activedate});
        this.dispatchEvent(event);
    }

    Init(){

        let hourscrolltimer = null;
        this.hourscroller.addEventListener('scroll', () => {
            if(hourscrolltimer !== null){
                clearTimeout(hourscrolltimer);
            }
            hourscrolltimer = setTimeout( () => {
                this.updateActiveDate();
            },100);
        },false);

        let periodscrolltimer = null;
        this.periodscroller.addEventListener('scroll', () => {
            if(periodscrolltimer !== null){
                clearTimeout(periodscrolltimer);
            }
            periodscrolltimer = setTimeout( () => {
                const prevperiod = this.period;
                this.period = this.periodscroller.getPeriod();
                if(prevperiod !== this.period){
                    this.setActivePeriod();
                }
            },100);
        },false);

        window.addEventListener('resize',this.load.bind(this));
    }

    setDatesBooked(booked_dates) {
        this.datesbooked = booked_dates;
    }

    load() {

        setTimeout( ()=>{
            
            this.hourscroller.reCalcScroll();
            this.periodscroller.reCalcScroll();
            
            this.setActiveDate(this.activedate);
    
        },200);
    }
    
}customElements.define('input-time',Time);

//export {Time};