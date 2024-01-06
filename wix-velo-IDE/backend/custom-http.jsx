import {fetch} from 'wix-fetch';
import {getSecret} from 'wix-secrets-backend'
import {format_time} from 'public/graphs-custom-helper-functions.js'
import {format_time_short} from "../public/graphs-custom-helper-functions";

const ALL = ['postHttpRequest', 'getAllEnabledDates_VictronSolution', 'findBasicSchoolInformationFromID_VictronSolution',
                        'fetchPowerAndTimeDataForDay_VictronSolution']

/* CAVEATS and missing functionalities */

/*
- Funktioniert noch nicht, wenn man die Terrassen ID eingibt; es muss diejenige ID eingegeben werde, die in den records zuerst erscheint, damit die andere Installation im
Verlauf des for loops eingefangen wird. function InitializeSchoolFromID()
- Sum of Installations functionality
- Points off and Fläche fett malen für GrundschülerInnen
- Bug fixen mit höherwertigen Polynomen (ab 11 numeric overflow)
- Gauss für Werte mit hoher Varianz; wie berechnet man aus dem, was ich angegeben habe, die Standartabweichung?
- Wochenaggregate
- Hochladebutton für Excel Dateien (damit z.B. die Daten von Solar for Schools analysiert werden können)
*/



/**
 * Uses an HTTP request to private python server.
 *
 * @param  {string} url         : The location of the private python server.
 * @param  {Object} message     : A dictionary containing all required parameters by the private python server to execute the fitting script.
 *
 * @return {Promise<any>}             : A dictionary containing the response of the private python server.
 *
 */
export async function postHttpRequest(url, message){
//method: post to connect to django API

    return fetch(url,
        {
            'method':'post',
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(message)
        }
    ).then((resp) => {return resp.text()}).then(
        respJSON => {
            //console.log(respJSON)
            return respJSON
        }
    )
        .catch(ex => {
            console.error("Error!",ex);
            console.log("text-ing the data failed. JSONing the data is tried now:")
            fetch(url,{'method':'get'}).then((resp) => resp.json()).then(
                respJSON => console.log(respJSON)
            ).catch(er=>console.log("Something happened 1 => ",er)).catch(er=>console.log("something happened 2 => ",er))
        })
}

/**
 * Gets all enabled dates for the victron solution by checking for each date in the parameter 'startEndArray' whether the query 'data.records.from_to_grid' is false or true.
 * This function uses the endpoint found at the URL 'https://vrm-api-docs.victronenergy.com/#/operations/installations/idSite/stats'.
 * It checks in range of 'startEndArray', for each day, whether data was logged for that day or not. VRM needs a unix timestamp for the 'start' and 'end' parameters.
 * Furthermore, according to the VRM documentation, when probing whether data was logged on a given day (using the interval: 'day' parameter), the max allowed time distance
 * between the start and the unix timestamp is 180 days. But, I have found this to not be true, since I managed to gather data for 360 days maximum time interval.
 *
 * On success, the message displayed is something like:
 *
 * {
 *     "success": true
 *     "records": {
 *         "from_to_grid": [
 *             [
 *                  // Timestamp for day at which data was found in MILLISECONDS (Javascript format). The hours of this timestamp is exactly equal to the hours of the 'start' parameter,
 *                  // Float, that I think represents the average power value for that day, e.g. -2.756145
 *             ],
 *             [
 *                 // second day etc.
 *             ]
 *         ]
 *     }
 * }
 *
 * If no data was found in the specified interval, the message is:
 *
 * {
 *     "success": true
 *     "records": {
 *         "from_to_grid": false
 *       }
 * }
 *
 *
 * If you have done something wrong, e.g. confused the 'start' with the 'end' parameter or the distance between the 'start' and 'end' timestamp is to big:
 *
 *
 * If no data was found in the specified interval, the message is:
 *
 * {
 *     "success": true
 *     "records": {
 *         "from_to_grid": []
 *       }
 * }
 *
 *
 *
 * @param  {string} siteID            : The string identifier associated with the side.
 * @param  {Object} startEndArray     : An array containing all unix timestamps at which to look data for.
 *
 * @return {Promise<any>}                   : A promise that resolves to an array containing all unix timestamps that data was found for
 *
 */
export async function getAllEnabledDates_VictronSolution(siteID,startEndArray){
    let allEnabledDates = []
    let accessToken = await getSecret("vrm_API_key");
    for (const yearlySubdivision of startEndArray){
        const [start, end] = yearlySubdivision
        const url = `https://vrmapi.victronenergy.com/v2/installations/${siteID}/stats?start=${start}&end=${end}&type=custom&interval=days&attributeCodes%5B%5D=from_to_grid`
        await fetch(url,{method:"get",headers:{
                "Content-Type": "application/json",
                "x-authorization": `Token ${accessToken}`,
            }}).then(rawData=>{return rawData.json()}).then(data=>{
            const records = data.records.from_to_grid
            if (records!==false){
                for (const record of records){
                    const [timestampJSDataWasFoundFor, averagePowerFound] = record
                    if (averagePowerFound > -0.3 ){
                        console.log("Sth smells fishy... average power found:", averagePowerFound, " at timestamp: ", format_time_short(Math.floor(timestampJSDataWasFoundFor/1000)))
                    }
                    if (averagePowerFound != null){
                        allEnabledDates.push(Math.floor(timestampJSDataWasFoundFor/1000))
                    }
                }}
        }).catch(er => console.log("An error occured within the 'getAllEnabledDates_VictronSolution' function when iterating through records: ",er)).catch(er => console.log("An error occured within the 'getAllEnabledDates_VictronSolution' function: rawdata.json() failed: ",er))
    }
    return allEnabledDates
}

/**
 * Fetches basic information about a victron site given the site ID.
 *
 * @param  {Boolean} debug            : Whether to print Debug statements or not.
 * @param  {string} SiteID            : The Victron's Site ID
 *
 * @return {Promise<any>}                   : Fetched information dictionary on the site.
 *
 */
export async function findBasicSchoolInformationFromID_VictronSolution(debug,SiteID){

    const accessToken = await getSecret("vrm_API_key");
    const UserID = await getSecret("vrm_iason_userID")
    const allSitesURL = `https://vrmapi.victronenergy.com/v2/users/${UserID}/installations?extended=0`

    return fetch(allSitesURL,{method:"get",headers:{
            "Content-Type": "application/json",
            "x-authorization": `Token ${accessToken}`,
        }}).then(ListOfAllSitesRaw => {
            if (debug===true){console.log('jsoning found VRM Site ID data. ')}
        return ListOfAllSitesRaw.json().then(ListOfAllSitesJSON=>{
            const records = ListOfAllSitesJSON['records']

            if (debug===true){console.log(' List of all Sites: ', ListOfAllSitesJSON)}

            let AssociatedInstallations = {};
            const NameofSchool = ['']


            for (const i in records){
                const nameOfSchool = records[i]["name"].split(",")[0] // works only if the VRM Name is sth like 'name of school, location of pv plant' e.g. "Gymnasium St. Ursula, Lenggries, Geräteschuppen"
                if (records[i]["idSite"].toString() === SiteID || nameOfSchool === NameofSchool[0]){

                    AssociatedInstallations[i] = {
                        installationID: records[i]["idSite"],
                        installationName: records[i]["name"],
                        installationCreationDate: format_time(records[i]["syscreated"])
                    };
                    NameofSchool[0] = nameOfSchool
                    if (debug===true){AssociatedInstallations.detailedInfo = records[i]}
                }
            }
            if (debug===true){console.log("AssociatedInstallations ",AssociatedInstallations)}
            return AssociatedInstallations
        }).catch(er=>console.log("Something went wrong when jsoning the data. Error Log-->" ,er))
    })
        .catch(er => {
            console.log("Something went wrong when getting all sites for the master user. Error log:  --> ", er)
        })
}


/**
 * Fetches time and power data about a victron site and day given the site ID and the chosen day.
 *
 * @param  {Boolean} debug            : Whether to print Debug statements or not.
 * @param  {string} SiteID            : The Victron's Site ID
 * @param  {number} start             : The timestamp representing the beginning of the day to fetch data for.
 * @param  {number} end               : The timestamp representing the end of the day to fetch data for.
 *
 * @return {Promise<any>}                   : Fetched information dictionary on the site and day (generation power and time array.).
 *
 */
export async function fetchPowerAndTimeDataForDay_VictronSolution(debug,SiteID, start, end){
    const mySecret = await getSecret("vrm_API_key");

    // fetch and manipulate the to be displayed power data
    const str = `https://vrmapi.victronenergy.com/v2/installations/${SiteID}/widgets/Graph?attributeCodes%5B%5D=from_to_grid&attributeIds%5B%5D=134&instance=0&start=${start}&end=${end}`

    return fetch(str,
        {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "x-authorization": `Token ${mySecret}`,
            },


        }).then((httpResponse) => {
        //console.log("response received. JSONing data")
        return httpResponse.json().then(result=>{

            if (debug===true){
                console.log("data successfully JSONed. Manipulating data entries. Debug is set to true, so printing whole message.")
                console.log("full power records non-manipulated: -> ",result, " START", start, " = ",format_time(start)," END", end, " = ", format_time(end))
            }
            const data = result.records.data[134]
            if (data.length!==0){
                let dataAsObject = [data].map(a => Object.fromEntries(a))[0];
                // chart js needs an object for its data sth like [{x: '13.3', y: 20}, {x: '22.75', y: 10}]
                Object.keys(dataAsObject).forEach(function(key, index) {
                    dataAsObject[key] = Math.abs((dataAsObject[key]-4))
                    if (dataAsObject[key]<7){dataAsObject[key]=0}
                    const newKey = format_time(+key).split(" ")[3].split(":")
                    //delete Object.assign(dataAsObject, {[returnHourArr(newKey)]: dataAsObject[key] })[key];
                });

                if (debug===true){
                    console.log("From function 'fetchPowerAndTimeDataForDay_VictronSolution': Finished. Data exists. (Length of power array not analyzed here).")
                    console.log("Manipulated X and Y Value Dict:", dataAsObject)
                }
                return dataAsObject
            }
            else{
                if (debug===true){
                console.log("From function 'fetchPowerAndTimeDataForDay_VictronSolution': Finished. No data exists.")
                return "noData"
                }
            }


        }).catch(er=>{console.log("something went wrong when json-ing the data ",er)})
    })
        .catch(ex => {console.error("Error when fetching download data!",ex)})

}


