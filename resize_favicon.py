from PIL import Image
import os

source_path = 'assets/logo3.png'
dest_path = 'assets/favicon.png'

try:
    img = Image.open(source_path)
    # Resize to 192x192 for standard android/web use, and high quality
    img = img.resize((192, 192), Image.Resampling.LANCZOS)
    img.save(dest_path, 'PNG')
    print(f"Successfully created {dest_path} from {source_path}")
except Exception as e:
    print(f"Error resizing image: {e}")
