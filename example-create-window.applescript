-- Example AppleScript to create and activate an iTerm window using iterm-mcp-multiple
-- This demonstrates how to use the --create-window entry point

-- NOTE: The --create-window option creates a new window each time it's called.
-- This is intentional behavior - each invocation creates a fresh terminal
-- window for the specified agent.

on run
    set agentName to "MyAgent"
    set profileName to "Default"
    
    -- Path to the built iterm-mcp-multiple executable
    set scriptPath to (path to me as text) & "::build:index.js"
    set scriptPath to POSIX path of scriptPath
    
    try
        -- Create window with agent name only
        do shell script "node " & quoted form of scriptPath & " --create-window --agent " & quoted form of agentName
        
        -- Or create window with both agent name and profile
        -- do shell script "node " & quoted form of scriptPath & " --create-window --agent " & quoted form of agentName & " --profile " & quoted form of profileName
        
        display notification "Window created for agent: " & agentName
        
    on error errorMessage
        display alert "Error creating window" message errorMessage
    end try
end run