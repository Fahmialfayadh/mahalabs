#!/bin/bash
# Download Google Fonts CSS and WOFF2 files

# 1. Download CSS with fake User-Agent (Chrome) to get woff2 links
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36" \
     -L -o assets/vendor/fonts/google-fonts-remote.css \
     "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300;400;600&family=Outfit:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Roboto+Slab:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"

# 2. Extract URLs, download files, and replace paths in CSS
# We'll read the remote CSS, find https://...woff2, download them, and replace the URL in CSS with relative path.

cd assets/vendor/fonts
cp google-fonts-remote.css google-fonts.css

# Find all font URLs
grep -o 'https://[^)]*\.woff2' google-fonts-remote.css | sort | uniq > font_urls.txt

# Loop through URLs
count=1
while read url; do
  # Extract filename from URL is tricky as they are often hashes or seemingly random.
  # We'll sequentially name them font-1.woff2, font-2.woff2 etc. or try to keep name if possible.
  # Google font URLs look like: https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2
  
  filename=$(basename "$url")
  # Shorten filename to avoid issues, just use the hash part usually? 
  # Actually, let's just download it as is.
  
  echo "Downloading $filename..."
  curl -s -L -o "$filename" "$url"
  
  # Replace URL in CSS file
  # Escape slashes in URL for sed
  escaped_url=$(echo "$url" | sed 's/[\/&]/\\&/g')
  sed -i "s|$escaped_url|$filename|g" google-fonts.css
  
  ((count++))
done < font_urls.txt

rm google-fonts-remote.css font_urls.txt
cd ../../..

echo "Fonts downloaded and CSS updated in assets/vendor/fonts/google-fonts.css"
