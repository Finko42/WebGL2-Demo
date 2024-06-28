import base64

MAIN_FILE = 'scripts/main.js'
# Output file is put in current directory
OUT_FILE  = 'demo.html'

HTML = '''<!DOCTYPE html>
<title>WebGL 2 Demo</title>
<style>
	html, body {
		height: 100%;
		margin: 0;
  }
	#c {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
<canvas id=c></canvas>
<script>
'''

def die(filename, lineNo, i, msg):
	print('Error: Compilation aborted.')
	print(filename+':'+str(lineNo)+':'+str(i+1)+': '+msg)
	exit()

# Runs all custom commands in inFile and puts result in outFile
# Calls itself on inserts (NOTE: Only main file can have inserts)
def preprocessFile(inFilename):
	with open(inFilename) as inFile:
		lineNo = 1
		start = 0
		for line in inFile:
			while True: # Search for cmd symbol
				i = line.find('@', start)
				if i == -1:
					# Symbol wasn't found so do nothing with rest of line
					outFile.write(line[start:])
					lineNo += 1
					start = 0
					break
				else: # Symbol was found
					# Write text before command to outFile
					outFile.write(line[start:i])
					# Get position after (
					j = i + 8
					# Get end of arg
					k = line.find(')', j)
					if k == -1:
						die(inFilename, lineNo, i, 'Missing )')
					match line[i+1:j]: # Command list
						case 'insert(': # Inserts file at command
							if inFilename != MAIN_FILE:
								die(inFilename, lineNo, i, 'Inserts only allowed in main file')
							preprocessFile(line[j:k])
						case 'base64(': # Converts file to base64 and puts it at command
							with open(line[j:k], 'rb') as f:
								outFile.write(base64.b64encode(f.read()).decode('utf-8'))
						case _: # No commands match
							die(inFilename, lineNo, i, 'Invalid command')
					# Check rest of line starting at end of command
					start = k + 1

with open(OUT_FILE, 'w') as outFile:
	outFile.write(HTML)
	preprocessFile(MAIN_FILE)
	outFile.write('\n</script>')
