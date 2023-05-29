let logList = []
const moodList = []
const dateList = []

fetch('/getmooddata')//get the user journal history
    .then(response => response.json())
    .then(fetchedData => {
        logList = fetchedData.logs
        handleServerData()
    })


function handleServerData() {
    logList.forEach(function (log) {
        moodList.push(log.mood)//push mood value to list
        let date = new Date(log.time);//get date value for x axis
        dateList.push(date.getDate() + "/" + (date.getMonth() + 1))
    })

    // console.log(moodList)
    // console.log(dateList)



    Chart.defaults.font.size = 14;
    new Chart(//new line chart
        document.getElementById('journalGraph'),
        {
            type: "line",
            data: {
                labels: dateList,//use data posted as x axis
                datasets: [{
                    backgroundColor: "#1a1a1a",
                    borderColor: "#1a1a1a",
                    data: moodList//use moods corresponding number as y axis
                }]
            },
            options: {

                events: [],//disable hover effects

                plugins: {
                    legend: {
                        display: false,//hide legend
                    }
                },


                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {

                                if (this.getLabelForValue(value) == 1) {//change y axis label based on value
                                    return "😵Awful"
                                }

                                if (this.getLabelForValue(value) == 2) {
                                    return "😒Bad"
                                }

                                if (this.getLabelForValue(value) == 3) {
                                    return "😑Ok"
                                }

                                if (this.getLabelForValue(value) == 4) {
                                    return "🙂Good"
                                }

                                if (this.getLabelForValue(value) == 5) {
                                    return "😀Great"
                                }



                            }
                        }
                    }
                }



            }
        });

}







