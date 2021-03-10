helper.getAllData();

function setActiveYear(e) {
  helper.activeYear = e.target.value;
  setMonthSelector(true)
  helper.table.setData(helper.year[helper.activeYear][helper.activeMonth]['_children']);
  const overviewTable = document.querySelector(".total-hours");
  overviewTable.innerHTML = helper.createOverview(getWorkedHours(), getTotalHours(), getHourBalance(), getPercentage());
}

function setActiveMonth(e) {
  helper.activeMonth = e.target.value;
  helper.table.setData(helper.year[helper.activeYear][helper.activeMonth]['_children']);
  const overviewTable = document.querySelector(".total-hours");
  overviewTable.innerHTML = helper.createOverview(getWorkedHours(), getTotalHours(), getHourBalance(), getPercentage());
}

function resetYearSelector() {
  document.querySelector('#yearSelector').innerHTML = '';
}
function setYearSelector() {
  resetMonthSelector();
  Object.keys(helper.year).map(function (year) {
    let option = document.createElement('option');
    option.value = year;
    option.text = year;
    option.selected = !!(year == helper.activeYear)
    document.querySelector('#yearSelector').appendChild(option)
  })
  if (document.querySelector('#yearSelector').children.length === 1) {
    document.querySelector('#yearSelector').disabled = true;
  }
}
function resetMonthSelector() {
  document.querySelector('#monthSelector').innerHTML = '';
}
function setMonthSelector(silent) {
  resetMonthSelector();
  Object.keys(helper.year[helper.activeYear]).map(function (month) {
    let option = document.createElement('option');
    option.value = month;
    option.text = helper.MONTHS_LONG[month];
    option.selected = !!(month == helper.activeMonth)
    document.querySelector('#monthSelector').appendChild(option)
  })
  if (silent) {
    document.querySelector('#monthSelector option:last-child').selected = true;
    helper.activeMonth = document.querySelector('#monthSelector option:last-child').value;
  }
  if (document.querySelector('#monthSelector').children.length === 1) {
    document.querySelector('#monthSelector').disabled = true;
  }
}
function getWorkedHours() {
  const workedHours = helper.year[helper.activeYear][helper.activeMonth]['workedMs'] / 3600;
  return workedHours;
}
function getHourBalance() {
  const totalHours = helper.year[helper.activeYear][helper.activeMonth]['totalHours'] * 8;
  const workedHours = helper.year[helper.activeYear][helper.activeMonth]['workedMs'] / 3600;
  const calculation = (workedHours - totalHours);
  return calculation
}
function getTotalHours() {
  const totalHours = helper.year[helper.activeYear][helper.activeMonth]['totalHours'] * 8
  return totalHours;
}
function getPercentage() {
  const workedHours = helper.year[helper.activeYear][helper.activeMonth]['workedMs'] / 3600;
  const totalHours = helper.year[helper.activeYear][helper.activeMonth]['totalHours'] * 8;
  const percentage = Math.floor((100 * workedHours) / totalHours);
  return percentage;
}

document.addEventListener("DOMContentLoaded", function () {


  document.querySelector('#yearSelector').addEventListener('change', setActiveYear);
  document.querySelector('#monthSelector').addEventListener('change', setActiveMonth);

  const response = JSON.parse(window.localStorage.getItem("HOURS"));
  const uniqueDays = {};

  const structuredResponse = response.data.map(function (data) {
    const year = new Date(data.startTime).getUTCFullYear();
    const month = helper.getMonth(data.startTime);
    const day = new Date(data.startTime).getDate();
    const dayOfTheWeek = new Date(data.startTime).getDay();
    if (helper.year[year] === undefined) {
      helper.year[year] = [];
    }
    if (helper.year[year][month] === undefined) {
      helper.year[year][month] = [];
    }
    if (helper.year[year][month][day] === undefined) {
      helper.year[year][month][day] = [];
    }
    if (helper.year[year][month]['_children'] === undefined) {
      helper.year[year][month]['_children'] = [];
    }
    if (helper.year[year][month]['workedMs'] === undefined) {
      helper.year[year][month]['workedMs'] = 0;
    }
    if (helper.year[year][month]['totalHours'] === undefined) {
      helper.year[year][month]['totalHours'] = 0;
    }
    if (uniqueDays[day] === undefined) {
      uniqueDays[day] = 0;
    }
    if (dayOfTheWeek < 6) {
      uniqueDays[day] = 8;
    }
    console.log(uniqueDays);
    helper.year[year][month]['workedMs'] += data.roundTime;
    helper.year[year][month]['totalHours'] = Object.keys(uniqueDays).length;
    helper.year[year][month][day].push(data);
    helper.year[year][month]['_children'].push(data)
  });

  Promise.all(structuredResponse).then(() => {

    setYearSelector();
    setMonthSelector();
    getWorkedHours();
    const overviewTable = document.querySelector(".total-hours");
    overviewTable.innerHTML = helper.createOverview(getWorkedHours(), getTotalHours(), getHourBalance(), getPercentage());
  })



  let welcomeText = "";
  if (helper.year) {
    helper.table = new Tabulator("#hours-table", {
      data: helper.year[helper.activeYear][helper.activeMonth]['_children'],
      selectable: false,
      dataTree: true,
      layout:"fitDataStretch",
      layoutColumnsOnNewData:true,
      pagination: "local",
      paginationSize: 100,
      paginationSizeSelector: true,
      groupBy: function (data) {
        const day = helper.getDay(data.startTime);
        const dayInTheWeek = helper.getDayInTheWeek(data.startTime);
        const month = helper.getMonth(data.startTime);

        return `${helper.DAYS_SHORT[dayInTheWeek]} ${day}-${helper.MONTHS_LONG[month]}`;
      },
      groupHeader: function (value, count, data, group) {
        const msValue = parseInt(data.map(helper.amount).reduce(helper.sum));
        const date = new Date(data[0].startTime);
        dateValue = date.getDate() + "-" + date.getMonth();
        return helper.getTimeInHoursAndMinutes(msValue, dateValue);
      },
      columns: [
        {
          title: "Dag",
          field: "startTime",
          width: 80,
          formatter: function (cell) {
            const day = helper.getDay(cell.getValue());
            const dayInTheWeek = helper.getDayInTheWeek(cell.getValue());
            const month = helper.getMonth(cell.getValue());
            return `${helper.DAYS_SHORT[dayInTheWeek]} ${day}-${month+1}`;
          },
        },
        {
          title: "Begin",
          field: "startTime",
          width: 60,
          headerSort: false,
          hozAlign: "center",
          formatter: function (cell) {
            const time = new Date(cell.getValue()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `${time}`;
          },
        },
        {
          title: "Eind",
          field: "endTime",
          width: 60,
          headerSort: false,
          hozAlign: "center",
          formatter: function (cell) {
            const time = new Date(cell.getValue()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `${time}`;
          },
        },
        {
          title: "Tijd afgerond",
          field: "roundTime",
          width: 140,
          hozAlign: "center",
          formatter: function (cell) {
            const quarters = cell.getValue() / 900;
            const showQuarters =
              quarters % 4 ? "," + (quarters % 4) * 25 + " uur" : " uur";
            const showHours = Math.floor(quarters / 4)
              ? Math.floor(quarters / 4)
              : "0";
            return showHours + showQuarters; //return the contents of the cell;
          },
        },
        { title: "Omschrijving", field: "description" },
        {
          title: "project",
          field: "customer",
          headerSort: false,
          formatter: function (cell) {
            return cell.getValue().name;
          },
        },
        {
          title: "TicketNr",
          field: "ticket",
          width: 100,
          headerSort: false,
        },
      ],
    });

    const overviewTable = document.querySelector(".total-hours");
    overviewTable.innerHTML = helper.createOverview(getWorkedHours(), getTotalHours(), getHourBalance(), getPercentage());
    welcomeText = `Welkom ${response.data[0].user.displayName}!`;
    document.querySelector(".welcome").textContent = welcomeText;
  } else {
    welcomeText = `Log eerst in op https://service.hipex.io/`;
    document.querySelector(".welcome").textContent = welcomeText;
  }

  document.querySelector(".settings").addEventListener("click", function () {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });
});
