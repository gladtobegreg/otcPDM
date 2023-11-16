###########################################################################
#
# OTC Product Database Manager and Random Transaction Generator
# Author: Gregory Guevara
# Date: October 2023
#
###########################################################################

import asyncio
import json
import os
import re
import requests
import time

############################################################################################
# Validation functions defined here to facilitate user input validation
############################################################################################

# Name length not too short and not too long
def nameLengthValidation(inputString):
    return len(inputString) in range(4,30)

# Define a function to validate a sku number input for length of 10 to 12
def skuLengthValidation(inputString):
    return len(inputString) in (10,11,12)

# Y/N characters only
def booleanCharacterValidation(inputString):
    return inputString.lower() in ('y', 'n')

# Only monetary values
def monetaryValueValidation(inputPrice):
    pattern = r'^[+]?(?:\d{1,3}(,\d{3})*(?:\.\d{0,2})?|\.\d{1,2}|\d{1,3}(,\d{3})*|\d{1,3}(,\d{3})*\.\d{0,2})$'
    return re.match(pattern, inputPrice) is not None

# Define a function to validate a folder category name
def folderCategoryValidation(inputString):
    return inputString in ('otc', 'food')

# Function for user input and user input validation, where default validation is always true
def question(prompt, validation=lambda input_str: True):
    # Loop until broken through return or exit statement
    while True:
        try:
            userInput = input(prompt)
            if validation(userInput):
                return userInput
            else:
                raise ValueError("Invalid input. Try again.") 
        except KeyboardInterrupt:
            print("\n  Ctrl+c was pressed. Exiting program.")
            exit()
        except:
            print(f"  Invalid input")

############################################################################################
# Utility functions defined here to facilitate display, functions, errors
############################################################################################

# Function used to facilitate calling quit function from dictionary with a message
def quitMessage():
    print("\n  You entered 'Q' to quit the program. Bye bye!")
    exit()

def sortJson(jsonData):

    # Define sorting function using a dictionary access operation
    def sortJsonByFullPrice(jsonObject):
        return jsonObject['fullPrice']

    return sorted(jsonData, key=sortJsonByFullPrice, reverse=True)

# End of sortJson

# Loading bar function
def printLoadingBar(iteration, total, bar_length=50):

    # Variables used to determine progress and total length
    percent = 100 * (iteration / total)
    filled_length = int(bar_length * iteration // total)
    bar = "#" * filled_length + "-" * (bar_length - filled_length)

    # Determine how print statement should behave
    if iteration < total:
        endParameter = "\r"
    else:
        endParameter = "\n"

    print(f"  [{bar}] {percent:.1f}%", end=endParameter, flush=True)

# End of printLoadingBar()

# Function used to facilitate calling an async function from dictionary
def callAsync2():
    loop = asyncio.get_event_loop()
    loop.run_until_complete(menuOption2())
    loop.close()

# Function used to facilitate wiping terminal for clean user experience
def clearTerminalScreen():
    if os.name == 'posix':
        os.system('clear')
    elif os.name == 'nt':
        os.system('cls')
    else:
        print("\n")

############################################################################################
# Operation functions that handle some sort of processing
############################################################################################

def deleteItem(inputSku, category):

    # Establish json file path
    parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category + '.json')

    # Open json file for reading, load data, and close file
    try:
        jsonFile = open(jsonFilePath, 'r+')
        jsonData = json.load(jsonFile)
        jsonFile.close()

    # Abort entire process
    except:
        print(f"  Failed to open {jsonFilePath}")
        return False

    # Index variable to store found item json index
    indexToRemove = None

    # Iterate json data and get index of matching json item
    for index, item in enumerate(jsonData):
        if inputSku in item["skuNum"]:
            indexToRemove = index
            break

    # If item was not found
    if not indexToRemove:
        print(f"\n  Item was not found in {category} database")
        return False

    # Item was found
    else:

        # Ask user to confirm deletion
        print(f"  The item being removed:\n\n{json.dumps(jsonData[indexToRemove], indent=4)}\n")
        confirmDelete = question("  Are you sure you want to delete this item from the database? Y/N ", validation=booleanCharacterValidation)

        # User has confirm deletion intention
        if confirmDelete.lower() == 'y':

            jsonData.pop(indexToRemove)

            # Write completed json data to file and close file
            jsonFile = open(jsonFilePath, 'w')
            json.dump(jsonData, jsonFile, indent=2)
            jsonFile.close()
            return True

        # User has denied deletion confirmation, abandon process
        else:
            print(f"\n  You have chosen not to delete the item")
            return False

# End of deleteItem

def updateItem(inputSku, category):

    # Establish json file path
    parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category + '.json')

    # Open json file for reading, load data, and close file
    try:
        jsonFile = open(jsonFilePath, 'r+')
        jsonData = json.load(jsonFile)
        jsonFile.close()

    # Abort entire process
    except:
        print(f"  Failed to open {jsonFilePath}")
        return False

    indexToUpdate = None

    # Iterate json data and get index of matching json item
    for index, item in enumerate(jsonData):
        if inputSku in item["skuNum"]:
            indexToUpdate = index
            break

    # If item was not found
    if not indexToUpdate:
        print(f"\n  Item was not found in {category} database")
        return False

    # Item was found
    else:

        fullPrice = 0.00

        # Show item to user
        print(f"  The item being updated:\n\n{json.dumps(jsonData[indexToUpdate], indent=4)}\n")

        updateNameBool = question("  Update the name of the item? Y/N ", booleanCharacterValidation)
        if updateNameBool.lower() == 'y':
            newName = question("  What is the new name of the item? ", validation=nameLengthValidation)
            jsonData[indexToUpdate]['name'] = newName

        updatePriceBool = question("  Update the price of the item? Y/N ", booleanCharacterValidation)
        if updatePriceBool.lower() == 'y':
            newPrice = question("  What is the new price of the item? ", validation=monetaryValueValidation)
            jsonData[indexToUpdate]['price'] = newPrice

        updateTaxBool = question("  Do you want to change the item's taxability? Y/N ", validation=booleanCharacterValidation)
        if updateTaxBool.lower() == 'y':
            if jsonData[indexToUpdate]['taxable'] == 'TAX':
                jsonData[indexToUpdate]['taxable'] = 'NO TAX'
            else:
                jsonData[indexToUpdate]['taxable'] = 'TAX'

        if updatePriceBool == 'y' or updateTaxBool == 'y':
            if jsonData[indexToUpdate]['taxable'] == 'TAX':
                fullPrice = float(jsonData[indexToUpdate]['price']) * 1.08875
                jsonData[indexToUpdate]['fullPrice'] = round(fullPrice, 2)
            else:
                jsonData[indexToUpdate]['fullPrice'] = jsonData[indexToUpdate]['price']

        if updateNameBool.lower() == updatePriceBool.lower() == updateTaxBool.lower() == 'n':
            print(f"\n  No changes were made to the item")
            return False

        # Write completed json data to file and close file
        jsonFile = open(jsonFilePath, 'w')
        json.dump(jsonData, jsonFile, indent=2)
        jsonFile.close()
        return True

# End of updateItem

# Define function to fetch barcode images for all items in particular json file and facilitate progress bar
async def barcodeSync(itemSku, category, index, total):

    # Define the endpoint url we will use
    apiUrl = 'https://barcodeapi.org/api/code128/'

    try:

        # Make an API call
        response = requests.get(apiUrl+itemSku, timeout=1)

        if response.status_code == 200:

            # Define the parent directory to access the images folder
            parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))

            # Check if the images folder exists or create it otherwise
            imagesDirectory = os.path.join(parentDirectory, 'images')
            os.makedirs(imagesDirectory, exist_ok=True)

            # Check if the specific category folder exists or create it otherwise
            categoryDirectory = os.path.join(imagesDirectory, category)
            os.makedirs(categoryDirectory, exist_ok=True)

            # Define the local path to save the image to
            filePath = os.path.join(categoryDirectory, itemSku+".png")

            # Save image to local folder
            file = open(filePath, 'wb')
            file.write(response.content)
            file.close()

        else:
            print(f"  Failed to retrieve the image. Status code: {response.status_code}")

    except Excepton as e:
        print(f"  API request error: {e}")

    printLoadingBar(index + 1, total)

# End of barcodeSync()

##############################################################################################
# Menu functions that handle some sort of processing and may make use of operation functions
##############################################################################################

# Define menuOption2() to run both sort() and barcodeSync()
async def menuOption2():

    # Request category from user
    category = question("\n  Would you like to sync the food database? Y/N ", booleanCharacterValidation)
    print()

    # Reformat user input to fit later use
    if category == 'y':
        category = 'food'
    else:
        category = 'otc'

    # Get data from json file
    parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category+'.json')

    # Open json file for reading, save data
    jsonFile = open(jsonFilePath, 'r+')
    jsonData = json.load(jsonFile)

    # Call sort function on otcData
    jsonData = sortJson(jsonData)

    # Set pointer at beginning, write the sorted data back to the file, close file
    jsonFile.seek(0)
    json.dump(jsonData, jsonFile, indent=2)
    jsonFile.close()

    # Create a sync tasks array
    tasks = []
    for index, item in enumerate(jsonData):
        task = barcodeSync(item['skuNum'], category, index, len(jsonData))
        tasks.append(task)

    # Launch async tasks cluster
    await asyncio.gather(*tasks)

    # Exit prompt
    confirmPrompt = question("\n  Done syncing database and barcodes\n  Press enter to continue...")
    clearTerminalScreen()

# End of menuOption2()

def menuOption3():

    print("\n  Creating a MASTER LIST of all database items\n\n  This function collects all items of a chosen database\n  and makes a file for you to view all items and their barcodes")

    category = question("\n  Do you want to look at the food database? Y/N ", validation=booleanCharacterValidation)

    if category.lower() == 'y':
        category = "food"
    else:
        category = "otc"

    # Establish json file path
    parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category + '.json')

    # Open json file for writing and load data
    jsonFile = open(jsonFilePath, 'r+')
    jsonData = json.load(jsonFile)
    jsonFile.close()

    html = ""

    if category == 'food':
        html = f"<html><head><title>{category} Master List</title></head><body><h1 style=font-size:50px>Food Master List</h1>"
    else:
        html = f"<html><head><title>{category} Master List</title></head><body><h1 style=font-size:50px>OTC Master List</h1>"

    # Loop through items and add items to html file
    for index, item in enumerate(jsonData):

        # Insert html display flex wrap every n items
        if index % 3 == 0:
            html += f"<div style='display: flex; flex-wrap: wrap;'>";

        # Insert data and png for each item, flex basis determines seperation space
        if item['taxable'] == 'TAX':
            # html += '<div style="flex-basis: 30%; padding: 20px;"><h2>${item.name}</h2><h3>Price: $${item.price} * => ( $${item.fullPrice} )</h3>';
            html += f"<div style='flex-basis: 30%; padding: 20px;'><h2>{item['name']}</h2><h3>Price: ${item['price']} * => ( ${item['fullPrice']} )</h3>";
        else:
            # html += '<div style="flex-basis: 30%; padding: 20px;"><h2>${item.name}</h2><h3>Price: $${item.fullPrice}</h3>';
            html += f"<div style='flex-basis: 30%; padding: 20px;'><h2>{item['name']}</h2><h3>Price: ${item['fullPrice']}</h3>";

        # Replace backslashes with forward slashes in the parentDirectory variable (may be required for windows)
        tempDirectory = parentDirectory.replace('\\', '/')
        html += f"<img src='{tempDirectory}/images/{category}/{item['skuNum']}.png'></div>"

        # Create seperation every three items
        if ((index + 1) % 3 == 0 or index == len(jsonData) - 1):
            html += f"</div>";        

    # End of for loop

    # Close off the html file
    html += f"<h3>Total Items: {len(jsonData)}</h3>"
    html += f"</body></html>";

    # Write html file to parent directory
    htmlFilePath = os.path.join(parentDirectory, 'masterList.html')
    htmlFile = open(htmlFilePath, 'w')
    htmlFile.write(html)
    htmlFile.close()

    # Exit prompt
    confirmPrompt = question("\n  File written successfully\n  Press enter to continue...")
    clearTerminalScreen()

# End of menuOption3()

# Define menuOption4() to add item to json file
def menuOption4():

    # Request data from user to inform item creation
    name = question("  What is the name of the item? ", validation=nameLengthValidation)
    skuNum = question("  What is the item's 11 or 12 digit sku number? ", validation=skuLengthValidation)
    price = float(question("  What is the price of the item? ", validation=monetaryValueValidation))
    taxable = question("  Is the item taxable? Y/N ", validation=booleanCharacterValidation)
    category = question("  Is the item a food product? Y/N  ", validation=booleanCharacterValidation)

    # Determine if folder category should be food or otc
    if category.lower() == 'y':
        category = 'food'
    else:
        category = 'otc'

    # Calculate the fullPrice and change taxable variable to a string value
    if taxable.lower() == 'y':
        taxable = 'TAX'
        fullPrice = price * 1.08875
    else:
        taxable = 'NO TAX'
        fullPrice = price

    # Create new json item
    newItem = {
        "name": name,
        "price": price,
        "skuNum": skuNum,
        "taxable": taxable,
        "fullPrice": round(fullPrice, 2)
    }

    # Establish json file path
    parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category + '.json')

    # Open json file for writing and load data
    jsonFile = open(jsonFilePath, 'r+')
    jsonData = json.load(jsonFile)

    # Append new json item to json file
    jsonData.append(newItem)

    # Write completed json data to file and close file
    jsonFile.seek(0)
    json.dump(jsonData, jsonFile, indent=2)
    jsonFile.close()

    # Exit prompt
    confirmPrompt = question(f"\n  New JSON item was added to the {category} database\n  Press enter to continue...")
    clearTerminalScreen()

# End of menuOption4

# Define menuOption5() to update item from json file
def menuOption5():

    # List of known json database categories
    categoryList = ['food', 'otc']

    # Ask user for item sku number
    inputSku = question("  Enter the first 10 or more digits of the item sku number: ", validation=skuLengthValidation)

    # Check each category for matching item, delete
    for category in categoryList:
        try:
            if updateItem(inputSku, category):
                print(f"  Item {inputSku} was updated successfully in {category} folder")
                break
            else:
                print(f"  No changes made in {category} database")
        except Exception as e:
            print(f"  updateItem() function failed to execute: {e}")

    # Exit prompt
    confirmPrompt = question("\n  Press enter to continue...")
    clearTerminalScreen()

# End of menuOption5

# Define menuOption6() to delete item from json file, starting with food json then otc json files
def menuOption6():

    # List of known json database categories
    categoryList = ['food', 'otc']

    # Ask user for item sku number
    inputSku = question("  Enter the first 10 or more digits of the item sku number: ", validation=skuLengthValidation)

    # Check each category for matching item, delete
    for category in categoryList:
        try:
            if deleteItem(inputSku, category):
                print(f"  Item {inputSku} was deleted successfully in {category} folder")
            else:
                print(f"  No changes made in {category} database")
        except Exception as e:
            print(f"  deleteItem() function failed to execute: {e}")

    # Exit prompt
    confirmPrompt = question("\n  Press enter to continue...")
    clearTerminalScreen()

# End of menuOption6

##################################################################
# Main menu launcher functions handle display and user input
##################################################################

# Initial menu with primary functions
def menuPrompt():

    # Create a dictionary of the available functions based on user input
    menuOptionDictionary = {
        '1': editMenuPrompt,
        '2': callAsync2,
        '3': menuOption3,
        'q': quitMessage
    }

    clearTerminalScreen()

    # Loop menu display
    while True:
        try:
            print("  ----------------------------------------------------------------------------------------------\n")
            print("    ITEM DATABASE MANAGER\n")
            print("  ----------------------------------------------------------------------------------------------\n")
            print("  The following functions are available...\n")
            print("    [1] Product Manager \t|  Add, delete, and update items in the database\n")
            print("    [2] Database Refresh \t|  Sort database and refresh barcode images\n")
            print("    [3] Master List Generator \t|  Create a master list html file of all database items\n")
            print("    [Q] QUIT\t\t\t|  Type 'Q' to exit the program\n")
            print("  ----------------------------------------------------------------------------------------------\n")

            userInput = question("\033[92m  Enter a menu option [1,2,3,Q] on the keyboard and press enter: \033[0m").lower()

            # Activate the function detailed in the above menuOptionDictionary
            if userInput in menuOptionDictionary:
                menuOptionDictionary[userInput]()
            else:
                print("Invalid input. Try again.")

        # Exit the loop if Ctrl+C is pressed
        except KeyboardInterrupt:
            print("\n  Ctrl+C was pressed. Exiting program.")
            break
        except Exception as e:
            print(f"  An error occurred: {e}")

# Secondary menu with sub-functions
def editMenuPrompt():

    # Create a dictionary of the available functions based on user input
    menuOptionDictionary = {
        '4': menuOption4,
        '5': menuOption5,
        '6': menuOption6,
        'b': menuPrompt,
        'q': quitMessage
    }

    clearTerminalScreen()

    # Loop menu display
    while True:
        try:
            print("  ----------------------------------------------------------------------------------------------\n")
            print("    DATABASE PRODUCT MANAGER\n")
            print("  ----------------------------------------------------------------------------------------------\n")
            print("  The following functions are available...\n")
            print("    [4] New Item Registration \t|  Add a new item to either OTC or Food database\n")
            print("    [5] Update Existing Item \t|  Update an existing item in the database\n")
            print("    [6] Delete Existing Item \t|  Delete an existing item in the database\n")
            print("    [B] BACK\t\t\t|  Type 'B' to return to the main menu\n")
            print("    [Q] QUIT\t\t\t|  Type 'Q' to exit the program\n")
            print("  ----------------------------------------------------------------------------------------------\n")

            userInput = question("\033[92m  Enter a menu option [4,5,6,B,Q] on the keyboard and press enter: \033[0m").lower()

            # Activate the function detailed in the above menuOptionDictionary
            if userInput in menuOptionDictionary:
                menuOptionDictionary[userInput]()
            else:
                print("Invalid input. Try again.")

        # Exit the loop if Ctrl+C is pressed
        except KeyboardInterrupt:
            print("\n  Ctrl+C was pressed. Exiting program.")
            break
        except Exception as e:
            print(f"  An error occurred: {e}")

##################################################################
# Main menu launcher starts the program
##################################################################

menuPrompt()

####################################################################################
#
# OTC Product Database Manager and Random Transaction Generator
# Author: Gregory Guevara
# Date: October 2023
#
####################################################################################
#
# This program greatly benefits from the services provided by BarcodeAPI.org
#
# The barcode API was used to retrieve barcode images for retail products
#
# The API documentation can be found at https://barcodeapi.org/manual.pdf
#
####################################################################################