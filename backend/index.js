import express from "express"
import {exec} from "child_process"
import fs from "fs"
import path from "path"
import os from "os"
import BMParser from "bookmark-parser"
const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json())

let chrome_url;
let firefox_url;
let chrome_running = false;
let firefox_running = false;

app.get("/start",(req,res)=>{
    const {browser,url} = req.query;
    if(!browser || !url) return res.status(400).send("Missing params")
    let cmd;
    if(browser === "chrome")
        {cmd= `start chrome.exe ${url}  --profile-directory="Personal"`
        chrome_url = url;
        chrome_running = true;
}
    else if(browser === "firefox")
    {
        cmd = `start firefox ${url}`
        firefox_url = url;
        firefox_running = true;
    }
    else
        return res.status().send("Unsupported browser")

    exec(cmd,(err)=>{
        if(err) return res.status(500).send("Cmd failed to start",err.message);
        res.send(`${browser} started with url ${url}`)
    })
})

app.get("/stop",(req,res)=>{
    const {browser} = req.query;
    if(!browser) return res.status(400).send("Missing params")
    let cmd;
    if(browser === "chrome")
    {
        cmd= `taskkill /IM chrome.exe /F`
        chrome_running = false;
    }
    else if(browser === "firefox")
    {
        cmd= `taskkill /IM firefox.exe /F`
        firefox_running = false;
    }
    else
        return res.status(400).send("Unsupported browser")

    exec(cmd,(err)=>{
        if(err) return res.status(500).send("Failed to stop",err.message);
        res.send(`${browser} stopped`)
    })
})

app.get("/cleanup", (req,res)=>{
     const {browser} = req.query;
    if(!browser) return res.status(400).send("Missing params")
    let dir;
    if(browser === "chrome")
        dir= path.join(os.homedir(),"AppData","Local","Google","Chrome","User Data","Personal")
    else if(browser === "firefox")
        dir= path.join(os.homedir(),"AppData","Roaming","Mozilla","Firefox","Profiles")
    else
        return res.status().send("Unsupported browser")
    if(fs.existsSync(dir)){
        fs.rm(dir,{recursive: true, force: true},(err)=>{
            if(err) return res.status(500).send("Failed to delete",err.message);
            res.send(`${browser} session data cleared`)
        })
    }else{
        res.status(404).send("Directory not found")
    }
})

app.get("/geturl", async (req,res)=>{
    const {browser} = req.query;
    const sessionPath = path.join(os.homedir(),"AppData","Local","Google","Chrome","User Data","Personal","Sessions")
    const files = fs.readdirSync(sessionPath).filter(f=>f.startsWith("Session"))
    if(files.length == 0){
        console.log("no session")
        return
    }
    if(browser=="firefox")
    {
    const data = await BMParser.readFromJSONLZ4File("C:/Users/Vedant/AppData/Roaming/Mozilla/Firefox/Profiles/v56qjxx8.default-release/sessionstore-backups/recovery.jsonlz4")
        .then(result => { 
          console.log(result.windows[0].tabs[result.windows[0].tabs.length-1].entries[0].url)
          const entries = result.windows[0].tabs[0].entries[0]
          res.send(result.windows[0].tabs[result.windows[0].tabs.length-1].entries[result.windows[0].tabs[result.windows[0].tabs.length-1].entries.length -1 ].url)
       }).catch(err => {
         res.send(err);
         console.log(err)
       });
    }

})

app.listen(PORT, ()=>{
    console.log("Server is running on port ",PORT)
})