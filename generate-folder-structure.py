#!/usr/bin/env python3
"""
Script to generate folder-structure.json from your actual folder structure
Run this in the same directory as your командиры and модули folders
"""

import os
import json

def scan_folder_structure():
    """Scan the folder structure and create a JSON mapping"""
    structure = {}
    
    # List of main folders to scan
    main_folders = ['командиры', 'модули']
    
    for main_folder in main_folders:
        if not os.path.exists(main_folder):
            print(f"Warning: Folder '{main_folder}' not found, skipping...")
            continue
            
        structure[main_folder] = {}
        
        # Get all subfolders
        try:
            subfolders = [f for f in os.listdir(main_folder) 
                         if os.path.isdir(os.path.join(main_folder, f))]
            
            for subfolder in subfolders:
                subfolder_path = os.path.join(main_folder, subfolder)
                
                # Get all image files in this subfolder
                image_extensions = {'.webp', '.jpg', '.jpeg', '.png', '.gif'}
                image_files = [f for f in os.listdir(subfolder_path)
                             if os.path.isfile(os.path.join(subfolder_path, f)) 
                             and os.path.splitext(f)[1].lower() in image_extensions]
                
                # Sort files alphabetically
                image_files.sort()
                
                structure[main_folder][subfolder] = image_files
                print(f"Found {len(image_files)} images in {main_folder}/{subfolder}")
                
        except Exception as e:
            print(f"Error scanning {main_folder}: {e}")
    
    return structure

def main():
    print("Scanning folder structure...")
    structure = scan_folder_structure()
    
    # Write to JSON file
    output_file = 'folder-structure.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(structure, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Generated {output_file}")
    print("\nFolder structure:")
    print(json.dumps(structure, ensure_ascii=False, indent=2))
    
    # Count total images
    total_images = sum(len(files) for folder in structure.values() 
                      for files in folder.values())
    print(f"\nTotal images found: {total_images}")

if __name__ == '__main__':
    main()