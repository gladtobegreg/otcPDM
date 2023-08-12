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
const fsP = require('fs').promises;
const readline = require('readline');

// Create readline interface for user i/o
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Declare items object for global scope
let items;

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

        // If valid answer, pass answer along
        if (checkFunc(answer)) {
          resolve(answer);
        }

        // Invalid answer, try again
        else {
          console.log('Invalid answer, try again');
          ask();
        }

      });
    }; // End of ask function definition

    // Call ask function
    ask();

  }); // End of promise

} // End of askQuestion function

// Randomly select an item, use a weight scaled on price:sum ratio
function selectItem(maxPrice) {

  // Sort the json items by price, high to low
  items.sort((a, b) => a.fullPrice - b.fullPrice);

  // Declare variables
  let sum = 0;
  let highestIndex = 0;

  // Iterate item database, get sum for valid items, track biggest valid index
  for (item of items) {
    if (item.fullPrice < maxPrice) {
      sum += parseFloat(item.fullPrice);
      highestIndex++;
    }
  };

  // We now have the sum of all items under the maxPrice and the index
  // of the highest priced item that falls under that maxPrice

  // Select a random number from the sum collected
  let randomIndex = Math.floor(Math.random() * sum);

  let tempIndex = 0;

  // Then find the corresponding item to the random number
  // by iterating through each item again, when the sum hits negative
  // values then we return that item

  for (item of items) {
    if (randomIndex > item.fullPrice) {

      randomIndex -= item.fullPrice;
      tempIndex++;
    }
    else {   
      
      randomIndex = tempIndex;
      break;
    }
  };

  return randomIndex;

} // End of selectItem function

async function randomizer(category, maxPrice) {

  // Create array to hold selected items
  const selectedItems = [];

  // Convert input max to two decimal place numerical value
  maxPrice = parseFloat(maxPrice);
  let tempMax = maxPrice;

  // Set a monetary minimum threshold to stay within
  const minimum = 0.98;

  let tempIndex = 0;

  // Loop while the maxPrice is greater than the defined minimum
  while(tempMax > minimum) {

    // Get index for a valid item, push item to array
    tempIndex = selectItem(tempMax, items);
    selectedItems.push(items[tempIndex]);

    // Reduce the max by the selected item's price, report
    tempMax = parseFloat(tempMax - items[tempIndex].fullPrice);

  } // End of while loop selecting items, array is full items and minimum is met

  return {
    selectedItems: selectedItems,
    remainder: tempMax
  };

} // End of randomizer function

function htmlBuilder(category, total, selectedItems, remainder) {

  // Report to console the array of items
  console.log(`\n  There are ${selectedItems.length} selected products.`);

  // Create html header
  let html = `<html><head><title>${category} Items List</title></head><body><h1 style=font-size:50px>${(category[0].toUpperCase()+category.slice(1))} Items List</h1><h2 style=font-size:35px>Target total: $${total}</h2>`;

  // Loop through items array and add items to html file
  for (let i = 0; i < selectedItems.length; i++) {

    const item = selectedItems[i];

    // Insert html display flex wrap every n items, background color for every other set of  2
    if (i % 2 === 0) {
      if (i % 4 === 2 || i % 4 === 3) {
        html += '<div style="display: flex; flex-wrap: wrap; background-color:#ededed;">';
      }
      else {
        html += '<div style="display: flex; flex-wrap: wrap;">';
      }
    }

    // Insert data and png for each item, flex basis determines seperation space
    if (item.taxable === 'TAX') {
      html += `<div style="flex-basis: 45%; padding: 5px;"><h2>${item.name}</h2><h3>Price: $${item.price} * => ( $${item.fullPrice} )</h3>`;
    }
    else {
      html += `<div style="flex-basis: 45%; padding: 5px;"><h2>${item.name}</h2><h3>Price: $${item.fullPrice}</h3>`;
    }

    // path of images relative to the html file
    html += `<img src="images/${category}/${item.name}.png"></div>`;

    if ((i + 1) % 2 === 0 || i === selectedItems.length - 1) {
      html += '</div>';
    }

  } // End of for loop

  // Close off the html file
  html += `<h2 style=font-size:35px>Final total: ~$${parseFloat(total-remainder).toFixed(2)}</h2></body></html>`;

  // Write the HTML code to a file
  fsP.writeFile('../selectedItems.html', html, (err) => {
    if (err) {
      console.log(`There was an error writing the html file ${err}`);
    }
  });

  return;

} // End of htmlBuilder function

//////////////////////////////////////////////////////////////////////////////////////////////////
// Questions Handler
//////////////////////////////////////////////////////////////////////////////////////////////////

// Handler function to call questions and process
async function askTransactionQuestions() {

  // Build questions, answers, and validation conditions

  // Clear the cmd terminal
  rl.output.write('\x1Bc');

  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);
  console.log(`    ITEM RANDOMIZER`);
  console.log(`\n  ----------------------------------------------------------------------------------------------\n`);
  console.log(`  The program will make a list of random products from the database to emulate a transaction.\n`);
  console.log(`  Answer the following two questions and hit enter. Type 'Q' to exit.\n`);
  console.log(`  ----------------------------------------------------------------------------------------------\n`);

  // Item type
  let category = await askQuestion('\x1b[32m  Would you like to request food items? Y/N: \x1b[0m',
    (answer) => /^[YyNn]$/.test(answer));

  // Transaction total
  let total = await askQuestion('\n\x1b[32m  What is the transaction total? \x1b[0m',
    (answer) => !isNaN(parseFloat(answer)) && isFinite(answer));

  // Assign category based of given answer
  if (category.toLowerCase() === 'y') {
    category = 'food';
  }
  else {
    category = 'otc';
  }

  return {
    category: category,
    total: total
  };

} // End of askTransactionQuestions function

//////////////////////////////////////////////////////////////////////////////////////////////////
// Main
//////////////////////////////////////////////////////////////////////////////////////////////////

async function main() {

  // Get user input for target values, item category and transaction total
  let userReq = await askTransactionQuestions(); // category and total

  // Read item database
  let data = await fsP.readFile(`../itemArchive/${userReq.category}.json`, 'utf-8');
  items = JSON.parse(data);

  // Select items from category and track remainder value
  let results = await randomizer(userReq.category, userReq.total); // selectedItems and remainder

  // Reroll randomizer 4 times to minizmize the remainder
  for (let i = 0; ((i < 4) && (results.remainder > 0.15)); i++) {

    // If remainder is already under 0.08 cents, break
    if (results.remainder < 0.08) {
      break;
    }

    // Otherwise, reroll and swap values if better
    else {
      let results2 = await randomizer(userReq.category, userReq.total);
      if (results2.remainder < results.remainder) {
        await Object.assign(results, results2);
      }
    } // End of else case

  } // End of for loop

  // Call htmlBuilder function to create the items list and report completion
  await htmlBuilder(userReq.category, userReq.total, results.selectedItems, results.remainder);
  console.log('  Random item list generated.\n  Find the html file in the project directory.\n');

  // Ask for user input before wiping the terminal
  await askQuestion('  Press enter to continue...',
    (answer) => /^$|\n|(.|\s)*/.test(answer));
  rl.close();

} // End of main function

main();

//////////////////////////////////////////////////////////////////////////////////////////////////
//
// OTC Product Database Manager and Random Transaction Generator
// Author: Gregory Guevara
// Date: August 2023
//
//////////////////////////////////////////////////////////////////////////////////////////////////