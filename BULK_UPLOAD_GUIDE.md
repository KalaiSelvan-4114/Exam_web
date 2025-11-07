# Bulk Upload Guide

This guide explains how to use the bulk upload feature to import data into the Exam Schedule Management System.

## Overview

The bulk upload feature allows you to import multiple records at once using Excel files (.xlsx, .xls). Each upload type has its own template format.

## Access

- **Exam Coordinator**: Can upload Users, Subjects, Halls, Exams, and Hall Plans
- **Department Coordinator**: Can upload Hall Plans for their department's exams

## Upload Types

### 1. Users Upload

**Template Columns:**
- `Email` (required): User email address (must be @psnacet.edu.in)
- `Name` (required): Full name of the user
- `Role` (required): One of: `student`, `staff`, `department_coordinator`, `exam_coordinator`
- `Department` (required for non-exam_coordinator): Department name or code
- `Year` (required for students): 1, 2, 3, or 4
- `Password` (optional): Default password (will be hashed automatically). If not provided, default is used.

**Example:**
```
Email                    | Name          | Role    | Department           | Year | Password
student1@psnacet.edu.in | John Doe      | student | Information Technology | 3   | pass123
staff1@psnacet.edu.in   | Jane Smith    | staff   | Information Technology |     | pass123
```

**Notes:**
- Passwords will be automatically hashed
- Year is only required for students
- Department can be name or code (must exist in system)
- Duplicate emails will be skipped

### 2. Subjects Upload

**Template Columns:**
- `Name` (required): Subject name
- `Code` (required): Subject code
- `Department` (required): Department name or code
- `Semester` (required): Semester number (1-8)

**Example:**
```
Name              | Code  | Department           | Semester
Data Structures   | CS301 | Information Technology | 3
Database Systems  | CS302 | Information Technology | 4
```

**Notes:**
- Subject code must be unique within a department
- Department must exist in the system

### 3. Halls Upload

**Template Columns:**
- `Name` (required): Hall name
- `Number` (required): Hall number
- `Capacity` (required): Maximum capacity (number)
- `Location` (required): Hall location/building
- `Department` (required): Department name or code

**Example:**
```
Name      | Number | Capacity | Location | Department
Main Hall | H001   | 60       | Block A  | Information Technology
Lab Hall  | H002   | 30       | Block B  | Information Technology
```

**Notes:**
- Hall number must be unique within a department
- Capacity must be a positive number

### 4. Exams Upload

**Template Columns:**
- `Subject` (required): Subject name
- `Department` (required): Department name or code
- `Date (YYYY-MM-DD)` (required): Exam date in YYYY-MM-DD format
- `Session (FN/AN)` (required): Session - FN (Forenoon) or AN (Afternoon)
- `TotalStudents` (required): Total number of students
- `Year1` (optional): Number of students from Year 1
- `Year2` (optional): Number of students from Year 2
- `Year3` (optional): Number of students from Year 3
- `Year4` (optional): Number of students from Year 4

**Example:**
```
Subject          | Department           | Date       | Session | TotalStudents | Year1 | Year2 | Year3 | Year4
Data Structures  | Information Technology | 2024-03-15 | FN     | 60            | 0     | 0     | 30    | 30
Database Systems | Information Technology | 2024-03-16 | AN     | 45            | 0     | 0     | 45    | 0
```

**Notes:**
- Date format must be YYYY-MM-DD
- Session must be FN or AN
- Year breakdown is optional but if provided, must sum to TotalStudents
- Subject must exist in the specified department
- Exams are automatically published after creation

### 5. Hall Plans Upload (DPC only)

**Template Columns:**
- `ExamId` (required): Exam ID from the system
- `HallName` (required): Hall name (must be assigned to the exam)
- `RangeStart` (required): Starting student number (e.g., 1)
- `RangeEnd` (required): Ending student number (e.g., 30)
- `Rows` (optional): Number of rows for seating matrix
- `Cols` (optional): Number of columns for seating matrix

**Example:**
```
ExamId                    | HallName | RangeStart | RangeEnd | Rows | Cols
507f1f77bcf86cd799439011  | Main Hall| 1          | 30       | 5    | 6
507f1f77bcf86cd799439011  | Lab Hall | 31         | 60       | 5    | 6
```

**Notes:**
- ExamId can be found in the exam list
- Hall must be already assigned to the exam
- Ranges must not overlap
- If Rows and Cols are provided, seating matrix will be generated automatically
- You can only upload plans for your department's exams

## How to Use

1. **Download Template**
   - Go to Bulk Upload page
   - Select the upload type
   - Click "Download Template" button
   - This downloads an Excel file with the correct column headers

2. **Fill the Template**
   - Open the downloaded Excel file
   - Fill in the data according to the format
   - Save the file

3. **Upload the File**
   - Select the filled Excel file
   - Click "Upload File" button
   - Wait for processing

4. **Review Results**
   - Check the success count
   - Review any errors
   - Fix errors and re-upload if needed

## Common Errors

- **"Department not found"**: Make sure the department name/code matches exactly (case-insensitive)
- **"Subject not found"**: Subject must exist in the specified department
- **"User already exists"**: Email is already registered
- **"Invalid date format"**: Use YYYY-MM-DD format for dates
- **"Hall not found in assignment"**: Hall must be assigned to the exam first
- **"Ranges must not overlap"**: Student number ranges cannot overlap

## Tips

1. **Start Small**: Test with a few rows first before uploading large files
2. **Check Data**: Verify department names, subject names, etc. before uploading
3. **Use Templates**: Always use the downloaded template to ensure correct format
4. **Review Errors**: Check error messages carefully to fix data issues
5. **Backup**: Keep a backup of your Excel files

## File Size Limit

- Maximum file size: 10MB
- Supported formats: .xlsx, .xls, .csv

## Support

If you encounter issues:
1. Check the error messages in the upload results
2. Verify your data matches the template format
3. Ensure all required fields are filled
4. Check that referenced data (departments, subjects, etc.) exists in the system

