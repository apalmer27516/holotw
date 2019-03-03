/*\
title: $:/plugins/abrahampalmer/holotw/main.js
type: application/javascript
module-type: syncadaptor
Working version to save to Holochain - will just hardcode and simplify things for starters
\*/

/* global $tw, fetch */
class HoloTW {
    /* I think I could try to connect to the WS here and use that for the other calls.
    I might still need to structure it to reconnect on error. */
    constructor (options) {
      console.log('In HoloTW Constructor')

      const { connect } = require('@holochain/hc-web-client')
      this.wiki = options.wiki

    }

    /*Gets the supplemental information that the adaptor needs to keep track of for 
    a particular tiddler.*/
    getTiddlerInfo (tiddler) {
      return {address: "HoloTW_Address"}
    }
  
    /* See I think "$:/core/modules/syncer.js". I think this is checking for login status
    and dealing with that. Holochain should take pre-wrap all the agent verification stuff
    so I should at this point just be able to return something useful about the logged in user. */
    getStatus (callback) {
        console.log('In HoloTW getStatus')
      callback(null, true, "Get agent name")
    }
  
    /* For this version, I am going to assume that the DHT is set to full replication
    so that it will be for just individual and team use. It should be possible to have
    another method where Holochain links are created for all references to other tiddlers 
    from a given tiddler and to then retrieve those in this list, but that would entail
    some more complicated tiddler parsing on the save with full checking and updating
    of the link references. Also I'm not sure how publishing for someone else to find
    something would work - add a link to a tiddler you know they already have?
    I might have to do something like create a tiddler which I made sure each agent 
    loaded by default which let people add links to it for public content and let people 
    follow it to individuals pages to share content with just them. 
    
    I might want to have this list in memory and then use a holochain callback to update it
    when needed. I don't think that is implemented yet. Callback is supposed to send 
    (error,<array of tiddler field object> so I need to verify what that is.*/
    getSkinnyTiddlers (callback) {
        console.log('In HoloTW getSkinnyTiddlers')
        
        callback(null)
    }
  
    /* Saving to the Holochain will not guarantee that Title's are unique and this is the 
    rule the TiddlyWiki interface enforces. For this reason if a Tiddler is loaded that
    conflicts with a current name, I think I am going to have to append to it something
    like "_CONFLICT_<agent name>_<datetime>". */
    loadTiddler (title, callback) {
        console.log('In HoloTW loadTiddler')

        //Check for a saved hash.
        //holochain-address = *get user field from tiddler*;
        if (holochain-address) {
          if (b58Check(holochain-address)) {
            // Call updateTiddler in Zome
          }
          else
            throw("Address to save Tiddler to Holochain has been corrupted.")
        }
        else {
          // Call addTiddler in Zome
        }
        callback(null)
        return
    }
  
    /* Check if the tiddler already has a hash saved to holochain-address. (Call b58Check 
      to do basic validation of the hash.) Then either save an update to the current entry
      or create a new one.*/
    saveTiddler (tiddler, callback, tiddlerInfo) {
        console.log('In HoloTW saveTiddler')

        //Check for a saved hash.
        //holochain-address = *get user field from tiddler*;
        if (holochain-address) {
          if (b58Check(holochain-address)) {
            // Call updateTiddler in Zome
          }
          else
            throw("Address to save Tiddler to Holochain has been corrupted.")
        }
        else {
          // Call addTiddler in Zome
        }

        callback(null)
        return true
    }
  
    deleteTiddler (title, callback, tiddlerInfo) {
        console.log('In HoloTW deleteTiddler')

        //Check for a saved hash.
        //holochain-address = *get user field from tiddler*;
        if (holochain-address) {
          if (b58Check(holochain-address)) {
            // Call deleteTiddler in Zome
          }
          else
            throw("Address to save Tiddler to Holochain has been corrupted.")
        }
        else {
          // I can probably just delete the entry from the TiddlyWiki and notify of error
          throw("Address to delete Tiddler from Holochain is empty.")
        }
      return true
    }

    /* The hash uses b58 encoding and I should do a basic check of what is in the Tiddler
    prior to trying to retrieve it from the Holochain. Check for 46 characters long with 
    everything a member of the following set. */
    b58Check (hash) {
      return ((hash.length == 46) && (46 == hash.match(/[1-9a-km-zA-HJ-NP-Z]/g).length))
    }
}
  
  if ($tw.browser) {
    exports.adaptorClass = HoloTW
  }