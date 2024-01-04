import {getSecret} from 'wix-secrets-backend'
import {fetch} from "wix-fetch";
import wixData from 'wix-data';

const ALL = ['checkDemoKey', 'grabDemoDataFromMasterCSV']

/**
 * Gets the secrete demo key using Wix Velo API and checks if input is equal to that.
 *
 * @param  {string} demoID : A array of length 2 that contains the to be zipped arrays
 *
 * @return {Promise<Boolean>}        : Whether the input was equal to the secret (true) or not (false).
 *
 */
export async function checkDemoKey(demoID){
    const CorrectDemoID = await getSecret("DemoID");
    // return true if equal, return false if not.
    return demoID === CorrectDemoID;
}

/**
 * Gets the text contents of the CSV file containing the master demo data for a given month.
 *
 * @param  {string} month : The month to grab the data for.
 *
 * @return {Promise<string>}       : Found data as array-like strings (generation, consumption, time.)
 *
 */
export async function grabDemoDataFromMasterCSV(month){

    const fetchDataFromCollection = await wixData.query("PVFittingInterfaceDemoData").eq("title",month).find()
    const dataFromWixBase = fetchDataFromCollection.items[0].document
    let externalURL = "https://fdb7009a-8efc-4f7d-a86a-ecf7229ad2e5.usrfiles.com/ugd/" + dataFromWixBase.split("/")[4];

    let file = await fetch(externalURL);
    return await file.text()
}