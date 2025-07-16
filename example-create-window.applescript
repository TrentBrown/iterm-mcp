-- Example AppleScript to create and activate an iTerm window using iterm-mcp-multiple
-- This demonstrates how to use the --create-window entry point

-- NOTE: The --create-window option creates a new window each time it's called.
-- This is intentional behavior - each invocation creates a fresh terminal
-- window for the specified client.

on run
    set clientName to "MyAgent"
    set profileName to "Default"
    
    -- Path to the built iterm-mcp-multiple executable
    set scriptPath to (path to me as text) & "::build:index.js"
    set scriptPath to POSIX path of scriptPath
    
    try
        -- Create window with client name only
        do shell script "node " & quoted form of scriptPath & " --create-window --client " & quoted form of clientName
        
        -- Or create window with both client name and profile
        -- do shell script "node " & quoted form of scriptPath & " --create-window --client " & quoted form of clientName & " --profile " & quoted form of profileName
        
        display notification "Window created for client: " & clientName
        
    on error errorMessage
        display alert "Error creating window" message errorMessage
    end try
end run