
# Mappinator

## Overview

The **Field Mapping Tool** is a web application that allows users to map fields between two files, supporting both CSV and JSON formats. This tool is particularly useful for data migration, integration tasks, or when comparing and aligning data structures between different systems.

## Features

- **Support for CSV and JSON Files**: Upload and map fields between two CSV files, two JSON files, or a combination of both.
- **Custom System Names**: Define custom names for each system or file, which are used throughout the interface and in the mapping outputs.
- **Field Extraction**:
  - **CSV**: Automatically parses headers and data types from CSV files.
  - **JSON**: Extracts all fields, including nested fields, from JSON objects.
- **Drag-and-Drop Mapping**: Intuitive interface to create mappings by dragging fields from one system to another.
- **Visual Connections**: Displays arrows between mapped fields for easy visualization.
- **Preview Mappings**: Provides a table preview of all mappings, including field names, data types, and sample values.
- **Export Mappings**: Download the mappings as a CSV file for further processing or documentation.
- **Responsive Design**: Interface adjusts to various screen sizes for better usability.

## Online Version
If you'd like to use Mappinator online, you can do so via this [link](https://daquino94.github.io/mappinator/)

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/daquino94/mappinator.git
   cd mappinator
   ```

2. **Serve the Application Locally**:

   To avoid issues with file access due to browser security restrictions, serve the application using a local server.

   - **Option 1: Using Python**

     ```bash
     # For Python 3.x
     python -m http.server 8000

     # For Python 2.x
     python -m SimpleHTTPServer 8000
     ```

     Then, open your browser and navigate to `http://localhost:8000`.

   - **Option 2: Using VS Code Live Server Extension**

     - Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in Visual Studio Code.
     - Open the project folder in VS Code.
     - Right-click on `index.html` and select **"Open with Live Server"**.

   - **Option 3: Using Node.js**

     ```bash
     npm install -g http-server
     http-server -p 8000
     ```

     Then, navigate to `http://localhost:8000`.

## Usage

1. **Open the Application**:

   Open `index.html` in your web browser via the local server as described above.

2. **Select File Type**:

   Choose between **CSV** and **JSON** by clicking on the respective tab.

3. **Set Custom System Names** (Optional):

   - Enter custom names for **System A** and **System B** in the provided input fields.
   - These names will be used throughout the interface and in the exported mapping file.

4. **Upload Files**:

   - **CSV**:
     - Upload the first and second CSV files using the file input fields.
     - Specify the delimiter if different from the default comma (`,`).
   - **JSON**:
     - Upload the first and second JSON files.

5. **Review Extracted Fields**:

   - The application will display the fields from each file/system.
   - For JSON files, nested fields are displayed using dot notation (e.g., `address.street`).

6. **Create Mappings**:

   - Drag a field from **System A** and drop it onto the corresponding field in **System B** to create a mapping.
   - An arrow will appear connecting the mapped fields.

7. **Preview Mappings**:

   - Scroll down to the **Mappings Preview** section to review all the mappings.
   - The preview includes field names, data types, and sample values from each system.

8. **Export Mappings**:

   - Click on the **"Download Mapping"** button to export the mappings as a CSV file.
   - The exported file includes detailed information about each mapping.

9. **Reset Mappings**:

   - Click on the **"Reset"** button to clear all mappings and start over.

## Dependencies

- **Bootstrap 4.5.2**: For styling and responsive layout.
- **jQuery 3.5.1 Slim**: For DOM manipulation and event handling.
- **Popper.js and Bootstrap JS**: For handling interactive components like tabs.

These dependencies are included via CDN links in the `index.html` file.

## File Structure

- `index.html`: The main HTML file containing the structure of the application.
- `style.css`: Custom CSS styles for the application.
- `script.js`: JavaScript code handling the application logic.

## Customization

- **Changing Default System Names**:

  The default names are set to "System A" and "System B". You can change these defaults in the `index.html` file by modifying the `value` attribute of the custom name input fields.

- **Modifying Styles**:

  Customize the look and feel of the application by editing the `style.css` file.

## Browser Compatibility

- Tested on modern browsers like **Google Chrome**, **Mozilla Firefox**, and **Microsoft Edge**.
- Ensure JavaScript is enabled for full functionality.

## Known Issues

- **Local File Access**: Due to browser security restrictions, direct file access may not work when opening `index.html` directly. Always serve the application through a local server.
- **Large Files**: Handling very large CSV or JSON files may affect performance.

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push the branch to your fork.
4. Open a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the open-source community for providing valuable resources and inspiration.

