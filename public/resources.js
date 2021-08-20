window.addEventListener('load', () => {
    const resources = document.getElementsByClassName('resource');

    Array.from(resources).forEach( resource => {
        const schedulebutton = resource.getElementsByClassName('schedule')[0];
        if(schedulebutton){
            schedulebutton.addEventListener('click', async () => {
                const datetimeinput = new DateTimeInput();
                const bookeddates = await getResourceBookDates(resource.id);
            
                datetimeinput.setTitle('Book your resource');
                datetimeinput.setFormAction('/newReservation','post');
                datetimeinput.setSubmitFunction(saveDateTime,resource.id);
                datetimeinput.setBookedDates(bookeddates);
                datetimeinput.setExtraInputs({ resource: resource.id});
            
                document.body.appendChild(datetimeinput);
                datetimeinput.load();
            });
        }
    });
},false);

const getResourceBookDates = async function(resourceName){

    return  await fetch('/getReservedDates', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({resourceName: resourceName})
    })
    .then(data => data.json())
    .then(response => {
        
        if(response.ok){
            return response.datesbooked;
        }
        return undefined;

    })
    .catch(catchError);
}

const saveDateTime = async function(date,resourceName = 'Elvis-MeasurementsLive') {
    return await fetch('/newReservation', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            resourceName: resourceName,
            account: JSON.parse(getMeta('account')),
            baseUrl: window.location.origin,
            dates: {
                dateAvailable : date,
                dateExpiring : new Date (date.getTime() + (60*60*1000) - 1000),
            }
        })
    })
    .then(data => data.json())
    .then(response => {
        switch(response.message){
            case 'saved': alert('You can now check your reservation'); break;
            case 'unavailable': alert('The date and time you chose has already been selected. \nChose another date.'); break;
            default: alert('An error ocurred. \nPlease try again.');
        }
    })
    .catch(catchError);
}