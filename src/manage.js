//////////////////////////////////////////////////////////////////////////////////////////////////
//
// OTC Product Database Manager and Random Transaction Generator
// Author: Gregory Guevara
// Date: August 2023
//
//////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////
// Required Statements
//////////////////////////////////////////////////////////////////////////////////////////////////

// Require statements
const https = require('https');
const fs = require('fs');
const fsP = require('fs').promises;
const readline = require('readline');

// Create readline interface for user i/o
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Functions
//////////////////////////////////////////////////////////////////////////////////////////////////

// askQuestion function creates a promise and also checks valid input
function askQuestion(question, checkFunc) {
  return new Promise((resolve) => {

    // Define ask function
    const ask = () => {
      rl.question(question, (answer) => {

        // Check for 'quit' input, close program
        if (answer.toLowerCase() === 'quit' || answer.toLowerCase() === 'q') {
          rl.close();
          process.exit(0);
        }

        // Check for 'back' input, go to askMenuOptionLoop()
        if (answer.toLowerCase() === 'back' || answer.toLowerCase() === 'b') {
          return askMenuOptionLoop();
        }

        // If valid answer, pass answer along
        else if (checkFunc(answer)) {
          resolve(answer);
        }

        // Invalid answer, try again
        else {
          console.log('  Invalid answer, try again');
          ask();
        }

      });
    }; // End of ask function definition

    // Call ask function
    ask();

  }); // End of promise

} // End of askQuestion function

function sortJSON(items, folder) {

  // Sort items by fullPrice value
  items.sort((a, b) => b.fullPrice - a.fullPrice);

  // Create json string from items
  const jsonString = JSON.stringify(items, null, 2);

  // Create path to write json file
  let path = '../itemArchive/' + folder.substring(0, folder.length - 1) + '.json';

  // writeFile to write back the sorted JSON
  fsP.writeFile(path, jsonString, 'utf8', err => {
    if (err) {
      console.log('  Error writing the file', err);
    } else {
      return;
    }
  }); // End of writeFile function

} // End of sortJSON function

function barcodeSync(items, folder) {

  // Note: barcodeSync() requires the standard fs module for 

  // Build API url
  const endpointURL = "https://barcodeapi.org/api/";
  const barcodeType = "code128";

  for (let item of items) {

    // Build url to make API call
    let url = `${endpointURL}${barcodeType}/${item.skuNum}`;
    // Define path for checking and writing file
    let path = `../images/${folder}${item.name}.png`;

    // Check each item has a corresponding image file
    fs.access(path, fsP.constants.F_OK, (err) => {

      // If there is no matching file, call API and write file
      if (err) {

        // Call barcode API
        https.get(url, (res) => {

          // Load data from API and write File
          let file = fs.createWriteStream(path);
          res.pipe(file);
          return;

        }).on('error', (err) => {
          console.log(`There was an error with the https.get() request: ${err}`);
        }); // End of https.get().on() function

      } // End of if(err) case

    }); // End of fsP.access() function
  } // End of for loop

} // End of barcodeSync function

async function doesItemExist(skuNum) {

  const filePath1 = '../itemArchive/otc.json';
  const filePath2 = '../itemArchive/food.json';

  try { // Try to readFile(filePath1)

    const data1 = await fsP.readFile(filePath1, 'utf8');
    const JSONContent1 = JSON.parse(data1);
    const index1 = JSONContent1.findIndex((item) => item.skuNum.slice(0, 10) === skuNum.slice(0, 10));

    // index found from filePath1
    if (index1 !== -1) {
      return {
        index: index1,
        filePath: filePath1,
        itemObject: JSONContent1[index1]
      };
    }

    // index not found from filePath1
    else {

      console.log(`Item sku number not found in ${filePath1} file`);

      try { // Sku not found in filePath1, try to readFile(filePath2)

        const data2 = await fsP.readFile(filePath2, 'utf8');
        const JSONContent2 = JSON.parse(data2);
        const index2 = JSONContent2.findIndex((item) => item.skuNum.slice(0, 10) === skuNum.slice(0, 10));

        // index found from filePath2
        if (index2 !== -1) {
          return {
            index: index2,
            filePath: filePath2,
            itemObject: JSONContent2[index2]
          };
        }

        // index not found from filePath2
        else {
          console.log(`Item sku number not found in ${filePath2} file`);
          return {
            index: -1,
            filePath: filePath2,
            itemObject: 'Not found, error'
          };
        }

      } catch (error) {
        console.log(`File path ${filePath2} does not exist`);
        return {
          index: -1,
          filePath: filePath2,
          itemObject: 'Not found, error'
        };
      }

    }

  // End of outter try statement, catch statement below
  } catch (error) { // Failed readFile(filePath1)

    console.log(`File path ${filePath1} does not exist`);
    console.log(error);

    try { // Try to readFile(filePath2)

      const data2 = await fsP.readFile(filePath2, 'utf8');
      const JSONContent2 = JSON.parse(data2);
      const index2 = JSONContent2.findIndex((item) => item.skuNum.slice(0, 10) === skuNum.slice(0, 10));

      // index found from filePath2
      if (index2 !== -1) {
        return {
          index: index2,
          filePath: filePath2,
          itemObject: JSONContent2[index2]
        };
      }

      // index not found from filePath2
      else {
        console.log(`Item sku number not found in ${filePath2} file`);
        return {
          index: -1,
          filePath: filePath2,
          itemObject: 'Not found, error'
        };
      }

    } catch (error) {
      console.log(`File path ${filePath2} does not exist`);
      return {
        index: -1,
        filePath: filePath2,
        itemObject: 'Not found, error'
      };
    } // Outter catch block

  } // End of outter catch block

} // End of doesItemExist

// newItem function creates a new json item and writes to the corresponding database file
async function newItem(fileName, item) {

  // Define directory and file path
  const directoryPath = '../itemArchive/';
  const filePath = directoryPath + fileName;

  // Try-catch block to check that directories exists, write otherwise
  try {
    // Check if the file exists
    await fsP.access(directoryPath, fsP.constants.F_OK);
  } catch (error) {
    // Directory does not exist, write it new
    await fsP.mkdir(directoryPath);
    console.log(`\n  New directory ${directoryPath} was written`);
  }

  // Try-catch block to check that file exists, write otherwise
  try {
    // Check if the file exists
    await fsP.access(filePath, fsP.constants.F_OK);
  } catch (error) {
    // File does not exist, write it fresh
    await fsP.writeFile(filePath, "[\n]");
    console.log(`\n  New file ${filePath} was written`);
  }

  try {

    // Read JSON, push item and write file
    const data = await fsP.readFile(filePath, 'utf8');
    const JSONContent = JSON.parse(data);
    JSONContent.push(item);
    const jsonString = JSON.stringify(JSONContent, null, 2);

    try {

      await fsP.writeFile(filePath, jsonString, 'utf8');
      console.log(`\n  \x1b[32m${item.name}\x1b[0m was added to ${filePath} file\n`);

    } catch (error) {
      console.log(`There was an error writing the file: ${error.message}`);
    } // End of writeFile try-catch block

  } catch (error) {
    console.log(`File path ${filePath} does not exist, read failed: ${error}`);
  } // End of readFile try-catch block

} // End of newItem function

async function updateItem(item, index, filePath) {

  try {

    // Read the file and splice item out before writing
    const data = await fsP.readFile(filePath, 'utf8');
    const JSONContent = JSON.parse(data);
    const itemName = JSONContent[index].name;
    JSONContent.splice(index,1,item);
    const jsonString = JSON.stringify(JSONContent, null, 2);

    try {

      // Write the file back after updating item
      await fsP.writeFile(filePath, jsonString, 'utf8');
      console.log(`\n  The \x1b[32m${itemName}\x1b[0m item has been updated\n`);

    } catch (error) {
      console.log(`There was an error writing the file: ${error}`);
    } // End of writeFile try-catch block

  } catch (error) {
    console.log(`File path ${filePath} does not exist, read failed: ${error}`);
  } // End of readFile try-catch block

} // End of updateItem function

// deleteItem function checks for and deletes an existing item
async function deleteItem(index, filePath) {

  try {

    // Read the file and splice item out before writing
    const data = await fsP.readFile(filePath, 'utf8');
    const JSONContent = JSON.parse(data);
    const itemName = JSONContent[index].name;
    JSONContent.splice(index,1);
    const jsonString = JSON.stringify(JSONContent, null, 2);

    try {

      // Write the file back after deleting item
      await fsP.writeFile(filePath, jsonString, 'utf8');
      console.log(`\n  ITEM \x1b[32m${itemName}\x1b[0m WAS DELETED\n`);

    } catch (error) {
      console.log(`There was an error writing the file: ${error}`);
    } // End of writeFile try-catch block

  } catch (error) {
    console.log(`File path ${filePath} does not exist, read failed: ${error}`);
  } // End of readFile try-catch block

} // End of deleteItem function

//////////////////////////////////////////////////////////////////////////////////////////////////
// Database Item Menu Function
//////////////////////////////////////////////////////////////////////////////////////////////////

// askItemEditMenuLoop function asks user to select one of the item edit functions to run
async function askItemEditMenuLoop() {

// User has requested to edit database items, serve different functions

  // Clear the cmd terminal
  rl.output.write('\x1Bc');

  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);
  console.log(`    DATABASE ITEM EDITOR\n`);
  console.log(`  ----------------------------------------------------------------------------------------------\n`);
  console.log(`  The following functions are available...\n`);
  console.log(`    [4] New Item Registration \t\t\t|  Add a new item to either OTC or Food database\n`);
  console.log(`    [5] Update Existing Item \t\t\t|  Update an existing item in the database\n`);
  console.log(`    [6] Delete Existing Item \t\t\t|  Delete an existing item in the database\n`);
  console.log(`    [Q] QUIT\t\t\t\t\t|  Type "Q" or "QUIT" at any time to exit the program`);
  console.log(`    [B] BACK\t\t\t\t\t|  Type "B" or "BACK" at any time to return to the main menu`);
  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);

  // Ask for user input
  let menuOption = await askQuestion('\x1b[32m  Enter a menu option [4,5,6,Q,B] on the keyboard and press enter: \x1b[0m',
    (answer) => /[456qQ]/.test(answer));

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 4
  //////////////////////////////////////////////////////////////////////////////////////////////////

  // New Item Registration
  if (menuOption === '4') {

    // Define characteristic
    let fullPrice = 0.00;

    console.log(`\n  Registering a new product.\n  Answer the following questions...\n`);

    // Define questions, answers, and validation conditions

    // Item name, length less than n characters
    let name = await askQuestion('  What is the name of the item? Enter a short name: ',
      (answer) => answer.trim().length > 0 && answer.trim().length < 35);

    // Item SKU, length 11 or 12 
    let skuNum = await askQuestion('  Enter an 11 or 12 digit sku number: ',
      (answer) => /^\d{11,12}$/.test(answer));

    // Item price, valid number
    let price = await askQuestion('  What is the price of the item?: ',
      (answer) => !isNaN(parseFloat(answer)) && isFinite(answer));

    // Item taxable, y/n
    let taxable = await askQuestion('  Is the item taxable? Y/N: ',
      (answer) => /^[YyNn]$/.test(answer));

    // Item a food item, y/n
    let category = await askQuestion('  Is the item a food? Y/N: ',
      (answer) => /^[YyNn]$/.test(answer));

    // Decide on category name based on category answer
    if (category.toLowerCase() === 'y') {
      category = 'food';
    }
    else {
      category = 'otc';
    };

    // Calculate full price based on taxable answer
    if (taxable.toLowerCase() === 'y') {
      taxable = 'TAX';
      fullPrice = parseFloat(price) * parseFloat(1.08875);
    }
    else {
      taxable = 'NO TAX';
      fullPrice = parseFloat(price);
    };

    // Create json item
    const item = {
      name: name,
      price: parseFloat(price),
      skuNum: skuNum,
      taxable: taxable,
      fullPrice: parseFloat(fullPrice.toFixed(2))
    };

    // Determine how to write json item based on category
    if (category === 'food') {
      await newItem('food.json', item);
      // Ask for user input before wiping the terminal
      await askQuestion('  Press enter to continue... ',
        (answer) => /^$|\n|(.|\s)*/.test(answer));
      askItemEditMenuLoop();
    } else if (category === 'otc') {
      await newItem('otc.json', item);
      // Ask for user input before wiping the terminal
      await askQuestion('  Press enter to continue... ',
        (answer) => /^$|\n|(.|\s)*/.test(answer));
      askItemEditMenuLoop();
    }

  } // End of new item registration, menuOption === '4'

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 5
  //////////////////////////////////////////////////////////////////////////////////////////////////

  // Update Existing Item
  if (menuOption === '5') {

    console.log(`\n  Updating an existing item.\n  Answer the following questions or enter 'N' to skip the question.\n`);

    // Get item SKU, length 10 or more 
    let skuNum = await askQuestion('  Enter the first 10 or more digits of the item sku number: ',
      (answer) => /^\d{10,15}$/.test(answer));

    // Check if item exists, set index and file path
    let {index, filePath, itemObject} = await doesItemExist(skuNum);

    // Item does not exist
    if (index === -1) {
      console.log(`  Item sku number not found\n`);

      // Ask for user input before wiping the terminal
      await askQuestion('  Press enter to continue... ',
        (answer) => /^$|\n|(.|\s)*/.test(answer));
      askItemEditMenuLoop();

    }

    // Item does exist, process
    else {

      // Present the original item properties to the user
      console.log(`\n  Name: \t${itemObject.name}\n  SKU Number: \t${itemObject.skuNum}\n  Price: \t${itemObject.price}\n  Tax: \t\t${itemObject.taxable}\n  Final Price: \t${itemObject.fullPrice} \n`);

      // Check with user about each property
      let newFullPrice = 0.00;

      // Ask about changing item's name
      let newName = await askQuestion(`  Change item name? Type a new name or type 'N' to skip.\n  `,
        (answer) => answer.trim().length > 0 && answer.trim().length < 35);

      // If answer is no, keep old name
      if (newName.toLowerCase() === 'n') {
        newName = itemObject.name;
      }

      // Ask about changing item's price
      let newPrice = await askQuestion(`  Change item price? Type a new price or type 'N' to skip.\n  `,
        (answer) => /^(\d+(\.\d{1,2})?|[nN])$/);

      // If answer is no, keep old price
      if (newPrice.toLowerCase() === 'n') {
        newPrice = itemObject.price;
      }

      // Ask about changing item's taxability
      let newTaxable = await askQuestion(`  Change item taxability? 'Y' to change taxability or 'N' to skip.\n  `,
        (answer) => /^[YyNn]$/.test(answer));

      // If answer is no, keep old taxability
      if (newTaxable.toLowerCase() === 'n') {
        newTaxable = itemObject.taxable;
      }

      else  {
        // Change taxability based on existing value
        if (itemObject.taxable.toLowerCase() === 'tax') {
          newTaxable = 'NO TAX';
        }
        else {
          newTaxable = 'TAX';
        }
      }

      if (newTaxable.toLowerCase() === 'no tax') {
        newFullPrice = parseFloat(newPrice);
      }
      else {
        newFullPrice = parseFloat(newPrice) * parseFloat(1.08875);
      }

      // Create json item
      const newItem = {
        name: newName,
        price: parseFloat(newPrice),
        skuNum: skuNum,
        taxable: newTaxable,
        fullPrice: parseFloat(newFullPrice.toFixed(2))
      };

      // Ask user to confirm update of item properties
      console.log(`\n\x1b[32m  The item after your changes will be...\x1b[0m\n\n  Name: \t${newItem.name}\n  SKU Number: \t${itemObject.skuNum}\n  Price: \t${newItem.price}\n  Tax: \t\t${newItem.taxable}\n  Final Price: \t${newItem.fullPrice} \n`);
      let deleteConfirm = await askQuestion(`\x1b[32m  Are you sure that you want apply these changes? Y/N: \x1b[0m`,
        (answer) => /[yYnNqQ]/.test(answer));

      // Delete was confirmed, continue
      if (deleteConfirm.toLowerCase() === 'y') {
        
        // If new properties are all same as original properties
        if (itemObject.name === newItem.name && itemObject.price === newItem.price && itemObject.taxable === newItem.taxable) {
          // Report no changes, back to item editor menu
          console.log('  No new changes were made to the item\n');
          await askQuestion('  Press enter to continue... ',
            (answer) => /^$|\n|(.|\s)*/.test(answer));
          askItemEditMenuLoop();
        }

        // Updates were verified, make changes
        else {

          // Update item specified item at given index and given filePath
          await updateItem(newItem, index, filePath);
          // Ask for user input before wiping the terminal
          await askQuestion('  Press enter to continue... ',
            (answer) => /^$|\n|(.|\s)*/.test(answer));
          askItemEditMenuLoop();
        }

      }

      // Update was denied, return to menu options or handle rejection
      else {
        console.log('  Item was not updated\n');
        // Ask for user input before wiping the terminal
        await askQuestion('  Press enter to continue... ',
          (answer) => /^$|\n|(.|\s)*/.test(answer));
        askItemEditMenuLoop();
      }

    } // End of item does exist case

  } // End of update existing item, menuOption === '5'

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 6
  //////////////////////////////////////////////////////////////////////////////////////////////////

  // Delete Existing Item
  if (menuOption === '6') {

    console.log(`\n  Deleting an existing item.\n  Answer the following questions...\n`);

    // Get item SKU, length 10 or more 
    let skuNum = await askQuestion('  Enter atleast 10 digits of the item sku number: ',
      (answer) => /^\d{10,15}$/.test(answer));

    // Check if item exists, set index and file path
    let {index, filePath, itemObject} = await doesItemExist(skuNum);

    // Item does not exist
    if (index === -1) {
      console.log(`  Item sku number not found\n`);

      // Ask for user input before wiping the terminal
      await askQuestion('  Press enter to continue... ',
        (answer) => /^$|\n|(.|\s)*/.test(answer));
      askItemEditMenuLoop();

    }

    // Item does exist, process
    else {

      // Ask user to confirm deletion of item with details
      let deleteConfirm = await askQuestion(`\x1b[32m  Are you sure that you want to delete ${itemObject.name} ? Y/N \x1b[0m`,
        (answer) => /[yYnNqQ]/.test(answer));

      // Delete was confirmed, continue
      if (deleteConfirm.toLowerCase() === 'y') {
        await deleteItem(index, filePath);
        // Ask for user input before wiping the terminal
        await askQuestion('  Press enter to continue... ',
          (answer) => /^$|\n|(.|\s)*/.test(answer));
        askItemEditMenuLoop();
      }

      // Delete was denied, return to menu options or handle rejection
      else {
        console.log('  Item was not deleted\n');
        // Ask for user input before wiping the terminal
        await askQuestion('  Press enter to continue... ',
          (answer) => /^$|\n|(.|\s)*/.test(answer));
        askItemEditMenuLoop();
      }

    } // End of item does exist case

  } // End of delete existing item, menuOption === '6'

} // End of askItemEditMenuLoop function


//////////////////////////////////////////////////////////////////////////////////////////////////
// Main Menu Function
//////////////////////////////////////////////////////////////////////////////////////////////////

// askMenuOptionLoop function asks user to select one of the program functions to run
async function askMenuOptionLoop() {

  // Clear the cmd terminal
  rl.output.write('\x1Bc');

  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);
  console.log(`    ITEM DATABASE MANAGER\n`);
  console.log(`  ----------------------------------------------------------------------------------------------\n`);
  console.log(`  The following functions are available...\n`);
  console.log(`    [1] Product Manager \t|  Add, delete, and update items in the database\n`);
  console.log(`    [2] Database Refresh \t|  Sort database and refresh barcode images\n`);
  console.log(`    [3] Master List Generator \t|  Create a master list html file of all database items\n`);
  console.log(`    [Q] QUIT\t\t\t|  Type "Q" or "QUIT" at any time to exit the program`);
  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);

  // Ask for user input
  let menuOption = await askQuestion('\x1b[32m  Enter a menu option [1,2,3,Q] on the keyboard and press enter: \x1b[0m',
    (answer) => /[123qQ]/.test(answer));

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 1
  //////////////////////////////////////////////////////////////////////////////////////////////////

  if (menuOption === '1') {
    askItemEditMenuLoop();
  } // End of menuOption 1 (Product Registration)

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 2
  //////////////////////////////////////////////////////////////////////////////////////////////////

  else if (menuOption === '2') {

    // Define paths for each database
    let path1 = '../itemArchive/otc.json';
    let path2 = '../itemArchive/food.json';

    try {
      const data1 = await fsP.readFile(path1, 'utf8');
      await sortJSON(JSON.parse(data1), 'otc/');
      await barcodeSync(JSON.parse(data1), 'otc/');
      console.log(`\n  Data in ${path1} has been sorted and missing barcodes downloaded`);
    } catch (error) {
      console.log(`  No such file as ${path1} exists`);
      console.log(error);
    } // End of try-catch block for path1

    try {
      const data2 = await fsP.readFile(path2, 'utf8');
      await sortJSON(JSON.parse(data2), 'food/');
      await barcodeSync(JSON.parse(data2), 'food/');
      console.log(`\n  Data in ${path2} has been sorted and missing barcodes downloaded`);
    } catch (error) {
      console.log(`  No such file as ${path2} exists`);
      console.log(error);
    } // End of try-catch block for path2

    // Ask for user input before wiping the terminal
    await askQuestion('\n  Press enter to continue...',
      (answer) => /^$|\n|(.|\s)*/.test(answer));
    askMenuOptionLoop();

  } // End of menuOption 2 (Barcode and Database Sync)

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Menu Option 3
  //////////////////////////////////////////////////////////////////////////////////////////////////

  else if (menuOption === '3') {

    console.log(`\n  Creating a MASTER LIST of all items\n  Type 'B' to go back to the database manager menu\n`);
  
    // Ask user for category of list to be made
    let category = await askQuestion('  Would you like to make a master list of food items? Y/N: ',
      (answer) => /^[yYnN]$/.test(answer));

    // Assign category based of given answer
    if (category.toLowerCase() === 'y') {
      category = 'food';
    }
    else {
      category = 'otc';
    }

    // Read the corresponding JSON file
    const data = await fsP.readFile(`../itemArchive/${category}.json`, 'utf8');
    let items = JSON.parse(data);

    // Report to console the array of items
    console.log(`\n  The ${category.toUpperCase()} database contains ${items.length} total items`);

    // Create html header
    let html = `<html><head><title>${category} Master List</title></head><body><h1 style=font-size:50px>${(category[0].toUpperCase()+category.slice(1))} Master List</h1>`;

    if (category === 'food') {
      html = `<html><head><title>${category} Master List</title></head><body><h1 style=font-size:50px>Food Master List</h1>`;
    }
    else {
      html = `<html><head><title>${category} Master List</title></head><body><h1 style=font-size:50px>OTC Master List</h1>`;
    }

    // Loop through items array and add items to html file
    for (let i = 0; i < items.length; i++) {

      const item = items[i];

      // Insert html display flex wrap every n items
      if (i % 3 === 0) {
        html += '<div style="display: flex; flex-wrap: wrap;">';
      }

      // Insert data and png for each item, flex basis determines seperation space
      if (item.taxable === 'TAX') {
        html += `<div style="flex-basis: 30%; padding: 20px;"><h2>${item.name}</h2><h3>Price: $${item.price} * => ( $${item.fullPrice} )</h3>`;
      }
      else {
        html += `<div style="flex-basis: 30%; padding: 20px;"><h2>${item.name}</h2><h3>Price: $${item.fullPrice}</h3>`;
      }

      html += `<img src="../images/${category}/${item.name}.png"></div>`;

      if ((i + 1) % 3 === 0 || i === items.length - 1) {
        html += '</div>';
      }

    } // End of for loop

    // Close off the html file
    html += `<h3>Total Items: ${items.length}</h3>`
    html += `</body></html>`;

    // Write the HTML code to a file
    fsP.writeFile(`../masterList${(category[0].toUpperCase()+category.slice(1))}.html`, html, (err) => {
      if (err) throw err;
    });

    // Report end
    console.log('  An HTML file was created in the main folder\n');

    // Ask for user input before wiping the terminal
    await askQuestion('  Press enter to continue... ',
      (answer) => /^$|\n|(.|\s)*/.test(answer));
    askMenuOptionLoop();

  } // End of menuOption 3 (Master List Maker)

} // End of askMenuOptionLoop function

//////////////////////////////////////////////////////////////////////////////////////////////////
// main Function
//////////////////////////////////////////////////////////////////////////////////////////////////

console.log(`\nWelcome to the product database program\nThe program is now loading\n`);
askMenuOptionLoop();

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// OTC Product Database Manager and Random Transaction Generator
// Author: Gregory Guevara
// Date: August 2023
//
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// This program greatly benefits from the services provided by BarcodeAPI.org
//
// The barcode API was used to retrieve barcode images for retail products
//
// The API documentation can be found at https://barcodeapi.org/manual.pdf
//
//////////////////////////////////////////////////////////////////////////////////////////////////
//
// MIT License
//
// Copyright (c) 2023 Gregory Guevara gladtobegreg
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
//
//////////////////////////////////////////////////////////////////////////////////////////////////
