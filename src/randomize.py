###########################################################################
#
# OTC Product Database Manager and Random Transaction Generator
# Author: Gregory Guevara
# Date: October 2023
#
###########################################################################

import json
import os
import random
import re
import traceback

############################################################################################
# Validation functions defined here to facilitate user input validation
############################################################################################

# Y/N characters only
def booleanCharacterValidation(inputString):
    return inputString.lower() in ('y', 'n')

# Only monetary values
def monetaryValueValidation(inputPrice):
    pattern = r'^[+]?(?:\d{1,3}(,\d{3})*(?:\.\d{0,2})?|\.\d{1,2}|\d{1,3}(,\d{3})*|\d{1,3}(,\d{3})*\.\d{0,2})$'
    return re.match(pattern, inputPrice) is not None

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
            print("\nCtrl+c was pressed. Exiting program.")
            exit()
		except:
			print(f"Invalid input")

############################################################################################
# Utility functions defined here to facilitate display, functions, errors
############################################################################################

# Function used to facilitate calling quit function from dictionary with a message
def quitMessage():
    print("\nYou entered 'Q' to quit the program. Bye bye!")
    exit()

# Function used to sort json data in ascending order of fullPrice
def sortJson(jsonData):

    # Define sorting function using a dictionary access operation
    def sortJsonByFullPrice(jsonObject):
        return jsonObject['fullPrice']

    return sorted(jsonData, key=sortJsonByFullPrice, reverse=False)

# End of sortJson

# Function to select an item index from json database given some maximum price value
def selectItem(tempMax, jsonData):

	# Sum of prices, start at 0
	sum = 0
	tempIndex = 0

	# Iterate jsonData for valid items, adding prices for a total sum
	for item in jsonData:
		if item['fullPrice'] < tempMax:
			sum += item['fullPrice']
		else:
			break

	# Select a random index from the sum of prices for all json items
	randomNum = random.uniform(0, sum)

	# Find correct item by iterating through json prices until sum is negative 
	for item in jsonData:
		if randomNum > item['fullPrice']:
			randomNum -= item['fullPrice']
			tempIndex += 1
		else:
			return tempIndex

	# Return the selected index
	return tempIndex

# End of selectItem

############################################################################################
# Operation functions that handle some sort of processing
############################################################################################

# Function to collect products based on given category and up to given maximum
def randomizer(category, maxPrice, jsonData):

	selectedItems = []
	index = None
	tempMax = maxPrice

	# Set a minimum monetary threshold to stay within
	minimum = 0.98

	# Sort for selection algorithm
	jsonData = sortJson(jsonData)

	while tempMax > minimum:

		# Get index from jsonData that falls under tempMax limit
		index = selectItem(tempMax, jsonData)

		item = jsonData[index]

		# Add selected item from json data at selected index
		selectedItems.append(item)

		tempMax = tempMax - item['fullPrice']

	return {'selectedItems': selectedItems, 'remainder': tempMax}

# End of randomizer

# Function to build and write html file based on collected parameters
def htmlBuilder(category, total, selectedItems, remainder):

	parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))

	# Create html header
	html = f"<html><head><title>{category} Items List</title></head><body><h1 style=font-size:50px>{(category[0].upper()+category[1:])} Items List</h1><h2 style=font-size:35px>Target total: {int(total)}</h2>"

	# Loop through items array and add items to html file
	for index, item in enumerate(selectedItems):

		item = selectedItems[index]

	    # Insert html display flex wrap every n items, background color for every other set of  2
		if index % 2 == 0:

			if index % 4 == 2 or index % 4 == 3:
				html += "<div style='display: flex; flex-wrap: wrap; background-color:#ededed;'>"
			else:
				html += "<div style='display: flex; flex-wrap: wrap;'>"

		# Insert data and png for each item, flex basis determines seperation space
		if item['taxable'] == 'TAX':
			html += f"<div style='flex-basis: 45%; padding: 5px;'><h2>{item['name']}</h2><h3>Price: ${item['price']} * => ( ${item['fullPrice']} )</h3>"
		else:
			html += f"<div style='flex-basis: 45%; padding: 5px;'><h2>{item['name']}</h2><h3>Price: ${item['fullPrice']}</h3>"

		# Replace backslashes with forward slashes in the parentDirectory variable (may be required for windows)
		tempDirectory = parentDirectory.replace('\\', '/')
		html += f"<img src='{tempDirectory}/images/{category}/{item['skuNum']}.png'></div>"

		if (index + 1) % 2 == 0 or index == (len(selectedItems) - 1):
			html += "</div>"

	# Close off the html file
	html += f"<h2 style='font-size:35px'>Final total: ~${round(total - remainder)}</h2></body></html>"

	# Write html file to parent directory
	htmlFilePath = os.path.join(parentDirectory, 'selectedItems.html')
	htmlFile = open(htmlFilePath, 'w')
	htmlFile.write(html)
	htmlFile.close()

	return

# End of htmlBuilder

##############################################################################################
# Menu functions that handle some sort of processing and may make use of operation functions
##############################################################################################

# Initial menu with primary functions
def menuPrompt():

	print("##########################################################################################\n")
	print("# Product Randomizer\n")
	print("##########################################################################################\n")
	print("    The program will make a list of random products from the database to emulate a transaction.")
	print("    Answer the following two questions and hit enter. Type 'Q' to exit.\n")

	# Request category from user, validate for Y/N answers only
	category = question("Would you like to randomize products from the food database? Y/N ", booleanCharacterValidation)

	# Request total from user, validate for monetary values
	total = float(question("What is your transaction total? ", validation=monetaryValueValidation))

	# Reformat user input to fit later use
	if category == 'y':
	    category = 'food'
	else:
	    category = 'otc'

	# Establish json file path
	parentDirectory = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
	jsonFilePath = os.path.join(parentDirectory, 'itemArchive', category + '.json')

	# Open json file for writing and load data
	jsonFile = open(jsonFilePath, 'r+')
	jsonData = json.load(jsonFile)
	jsonFile.close()

	# Collect randomized items and calculate remainder
	itemAndRemainder = randomizer(category, total, jsonData)
	selectedItems = itemAndRemainder['selectedItems']
	remainder = itemAndRemainder['remainder']

	# Loop four times to achieve smaller remainder
	for i in range(5):

		# Sufficiently small remainder, break
		if remainder < 0.09:
			break

		# Try to get smaller remainder
		else:

			# get it
			itemAndRemainder2 = randomizer(category, total, jsonData)

			# check it
			if itemAndRemainder2['remainder'] < remainder:
				selectedItems = itemAndRemainder['selectedItems']
				remainder = itemAndRemainder['remainder']

	try:
		htmlBuilder(category, total, selectedItems, remainder)
	except Exception as e:
		print(f"Failed to build and write html file: {e}")
		traceback.print_exc()

	# Exit prompt
	confirmPrompt = question("Done creating random transaction\nPress enter to continue...")

# End of menuPrompt

##################################################################
# Main menu launcher starts the program
##################################################################

menuPrompt()

###########################################################################
#
# OTC Product Database Manager and Random Transaction Generator
# Author: Gregory Guevara
# Date: October 2023
#
###########################################################################