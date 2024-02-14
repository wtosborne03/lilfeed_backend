# lil-Feed Backend

This is a backend server designed to support the frontend with a simple rest api and sms-based authentication.

## Table of Contents
- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction
lil-Feed is a hobby microblogging app that lives on your phone number. This repository contains the backend codebase developed using Node.js, Express.js, Sequelize, and SQLite. Additionally, it integrates with the TeleSign SMS API for verification purposes.

## Technologies Used
- Node.js
- Express.js
- Sequelize
- SQLite
- TeleSign SMS API

## Installation
To install and run this backend server locally, follow these steps:

1. Clone this repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install the dependencies.
4. Run `npm start` to start the server.

## Configuration
Before running the server, ensure you configure the necessary environment variables. A sample configuration file `sample.config.js` is provided as a template. Rename this file to `config.js` and fill in the required values.

## Usage
1. **POST /verify**
   - *Functionality*: Generates a verification code, sends it via SMS using the TeleSign API, and creates or updates a user in the database.
   - *Request Body*: `{ "number": "user_phone_number" }`

2. **GET /login**
   - *Functionality*: Displays the login page.

3. **POST /logout**
   - *Functionality*: Logs the user out.

4. **POST /confirm**
   - *Functionality*: Authenticates the user based on their phone number and verification code, redirects to the user's profile page if successful.
   - *Request Body*: `{ "username": "user_phone_number", "password": "verification_code" }`

5. **PUT /user**
   - *Functionality*: Updates the user's information.
   - *Request Body*: User information to be updated.

6. **GET /user/:number**
   - *Functionality*: Retrieves a user's profile based on their phone number.
   - *Path Parameter*: `number` - User's phone number.
   - *Response*: User's profile information.

7. **GET /user**
   - *Functionality*: Retrieves the currently authenticated user's profile.
   - *Response*: Current user's profile information.

8. **POST /post**
   - *Functionality*: Creates a new post.
   - *Request Body*: Post data including title and content.

9. **GET /protected**
   - *Functionality*: Checks if the user is authenticated to access protected routes.


## Contributing
Contributions to this project are welcome! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

Please ensure your code follows the project's coding standards and includes appropriate tests.

