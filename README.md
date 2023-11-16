# OTC Product Database Manager and Random Transaction Generator

## Introduction

A database management and transaction generator program, built in both Node.js and Python. Intended to provide a streamlined utility for a fast-paced retail environment. The main goal of the program is to help maintain a database of items and provide some essential functionality for every day use.

The program taps into the simplicity and straight forward nature of the command line terminal. A menu is displayed to act as a general overview of functionality. With minimal input from the user, tasks like managing database items, pulling barcodes from an API, and creating an easy to view/print full database document is made fast and easy. Additionally, generating random transactions that pull items from the database can be done in an intuitive way.

## Overview

The README file is meant to fully describe and explain the different functions of the program for potential users and give context to curious readers on how things work. Generally speaking, there are two types of over the counter products which this program intendeds to help manage. We can refer to these two types of products as "OTC" products: traditional health and wellness related items, and "Food" products: eligible healthy foods and dietary supplements. Any aspect of the program that needs to distinguish between the two types of products will simply ask the user to specify. The different products are maintained in seperate databases to better serve the common use cases and readability.

The program consists of two executable files, `manage` and `randomize`, in both javascript and python file extensions.

`manage` presents three main functions that all help maintain the two JSON databases, `food.json` and `otc.json`.

The functions found consist of the following...

	Item Manager
	Database Refresh
	Master List Generator

Item Manager will allow the user to add a new item and update/delete existing items. Each function requiring various questions to be answered to build a complete valid database action. Database Refresh will perform an API call to complete all database items with their respective barcodes and also sort the database by price for readability. Lastly, Master List Generator will create an HTML document that can be easily viewed or printed for reference. The file would be called 'masterListXXXX.html' file, where XXXX would be filled by either 'Otc' or 'Food'.

`randomize` will build an HTML document of randomly pulled items that form a transaction, corresponding to the criteria given by the user. The items are selected randomly using a weight that scales to the prices of all items. This creates realistic and easy to view transactions that may facilitate employee training and point-of-sale system testing. The HTML document would be called 'selectedItems.html'.

## File Directory Structure

A certain file structure is required for the programs to operate. A folder in the main project directory called "images" should contain two more folders, "otc" and "food." These two folders will house all the barcode images tied to database items and may be collected to showcase the items. Another folder is required, "itemArchive," which will contain the JSON files `food.json` and `otc.json` that act as a database for their respective products. If the JSON files do not exist, the program will create them when registering a new item.

	 otcProject	> images > otc  > ...
			  	   	> food > ...
		 	> itemArchive > ...

## Running the programs

The programs can be executed in the command line terminal using either NodeJS or Python (and optionally script shortcuts, discussed in detail later). To execute any of these programs from the command line, open the Windows File Explorer and navigate to the project directory. From here, type 'cmd' into the address bar, and a command line terminal will open up. The syntax for running a NodeJS program is 'node myProgram.js', where 'myProgram' is the name of the program. Similarly, the syntax for running a Python program is 'python myProgram.py', where 'myProgram' is the name of the program. In our case, the following lines can be used to execute the corresponding program...

	'node manage.js',
	'node randomize.js',
	'python manage.py',
	'python randomize.js'.

You can view and edit the JSON database by opening the .json files using any text editor, like the native Windows Notepad program.

It may be worth mentioning that if an item has been updated or removed, some dependencies may be interrupted and cause errors. To avoid any conflicts or to troubleshoot a file dependency errors (such as a missing/empty barcode image), be sure to delete all images in the two images folders and then refresh the database using the Database Refresh function of the `manage` program. This will pull all needed barcode images from zero. Network and API conditions may require the refresh to be done multiple times although in normal circumstances, it should work on the first shot. Similarly, outdated master lists will also require new compilation to stay updated with the newest item details. Simply delete the file 'masterListXXXX.html' file and run the Master List function again to generate an up to date list. The 'selectedItems.html' file generated by the `randomize` program should be considered discardable and always outdated, as it only ever reflects product details generated at a fixed point in time.

## Additional Notes

### Bad characters

I found that certain funny characters in the name of items can mess up certain processes. For example, '?' and '/' will cause issues, where some items will not load barcodes. This is a side effect of the programming language and API calls syntaxes.

### Master List HTML File Printing

When printing the master list HTML page, use a scale factor of about 0.60 for better spacing on a single page. Moreover, consider also adjusting the following values...

	if (i % 3 === 0) {                <--- change the '3' value to adjust the items per line

	flex-basis: 30%; padding: 20px;   <--- change the flex % and the padding px value to adjust spacing

...which can be found in the "menuOption3" section of the askMenuOptionLoop() function.

### Windows Environment Easy Execution

The two batch files (`.bat` file extension) are designed to make the execution aspect of the two programs easy for users by automatically launching/closing the command terminal, running the appropriate commands, and any additional parameters for seamless user interaction. Simply launch the batch script (double-click the icon or highlight and press enter).

An easy way to execute any one of the two batch scripts from the taskbar is to make a cmd.exe shortcut and editing the "target" from...

	%windir%\system32\cmd.exe

	to:

	%windir%\system32\cmd.exe /c C:\Users\User\Desktop\otcProject\manage.bat

...where '/c' closes the cmd windows after exec [or '/k' to keep open].

Also, change "start in" from
its default location to...

	C:\Users\User\Desktop\otcProject\

... where the path is relative to the specific directory structure of the operating computer.

When the cmd shortcut has been changed to match the above syntax,
it can then be added to the task bar and be executed with a single click.

Note that the batch files were written to utilize the Python version of the programs and should be edited slightly to function with the javascript versions. To do so, simply edit the files and with any text editor change the lines detailed below...

	python manage.py > node manage.js
	python randomize.py > node randomize.js

Or vise versa to change batch script from python to javascript.