import sys
import json
import pyautogui

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing command argument"}))
        return

    command = sys.argv[1]
    args = sys.argv[2:]

    try:
        if command == "move":
            x, y = int(args[0]), int(args[1])
            pyautogui.moveTo(x, y, duration=0.5)
            print(json.dumps({"status": "success", "message": f"Moved to {x}, {y}"}))
        
        elif command == "click":
            pyautogui.click()
            print(json.dumps({"status": "success", "message": "Clicked"}))
        
        elif command == "type":
            text = " ".join(args)
            pyautogui.typewrite(text, interval=0.05)
            print(json.dumps({"status": "success", "message": f"Typed: {text}"}))

        elif command == "hotkey":
            pyautogui.hotkey(*args)
            print(json.dumps({"status": "success", "message": f"Pressed hotkey: {args}"}))
            
        elif command == "screenshot":
            filepath = args[0] if len(args) > 0 else "screenshot.png"
            pyautogui.screenshot(filepath)
            print(json.dumps({"status": "success", "message": f"Saved screenshot to {filepath}"}))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
