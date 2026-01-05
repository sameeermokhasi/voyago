
import re

regex = "https://.*\.netlify\.app|https://.*\.onrender\.com"
origin = "https://voyage-go.netlify.app"

if re.match(regex, origin):
    print("Match!")
else:
    print("No Match!")

origin2 = "https://voyage-go.netlify.app/" # Trailing slash?
if re.match(regex, origin2):
    print("Match slash!")
else:
    print("No Match slash!")
