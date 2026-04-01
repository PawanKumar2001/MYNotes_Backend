const express = require('express');
const router = express.Router()
const Notes = require("../Models/Notes");
var getuser = require('../Middleware/getuser');
const { body, validationResult } = require("express-validator");

//Route 1 - Fetching all the notes of the user
//Endpoint - /api/notes/fetchnotes
router.get('/fetchnotes', getuser, async (req, res) => {
    try {
        const notes = await Notes.find({ user: req.user.id });
        res.json(notes)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error from server side :(");
    }

})

//Route 2 - Adding a new note
//Endpoint - /api/notes/addnote
router.post('/addnote', getuser,
    //validating the notes
    [body("title", "Title is too short").isLength({ min: 1 }),
    body("description", "Description is too short").isLength({ min: 3 }),
    ], async (req, res) => {
        try {
            //error handling while creating a note
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            //creating and saving a new note
            const { title, description, notebody } = req.body;
            const note = new Notes({
                title, description, notebody, user: req.user.id
            });
            const savedNote = await note.save();
            res.json(savedNote);
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Error from server side :(");
        }

    })

    //Route 3 - Updating an existing note
    //Endpoint - /api/notes/updatenote/:id
    router.put('/updatenote/:id', getuser, async (req, res) => {
        const { title, description, notebody } = req.body;
        //creating a newnote object
        const newNote = {};
        if(title){
            newNote.title = title;
        }
        if(description){
            newNote.description = description;
        }
        if(notebody){
            newNote.notebody = notebody;
        }

        //locating the note to be updated
        let findNote = await Notes.findById(req.params.id);
        if(!findNote){
            return res.status(404).send("Not Found");
        }

        //checking if user trying to edit the note is the actual user
        if(findNote.user.toString() !== req.user.id){
            return res.status(401).send("Operaton not allowed");
        }

        //final note updation and sending
        try {
            findNote = await Notes.findByIdAndUpdate(req.params.id, {$set: newNote}, {new:true});
            res.json({findNote});
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    })

    //Route 4 - Deleting a note
    //Endpoint - /api/notes/deletenote/:id
    router.delete('/deletenote/:id', getuser, async (req, res) => {
        let findNote = await Notes.findById(req.params.id);
        
        //locating the note to be updated
        if(!findNote){
            return res.status(404).send("Not Found");
        }
        
        //checking if user trying to delete the note is the actual user
        if(findNote.user.toString() !== req.user.id){
            return res.status(401).send("Operaton not allowed");
        }

        //final note updation and sending
        try {
            findNote = await Notes.findByIdAndDelete(req.params.id);
            res.json({"Success": "Note deleted successfully"});
        } catch (error) {
            console.error(error.message);
            res.status(500).send("Server Error");
        }
    })

module.exports = router