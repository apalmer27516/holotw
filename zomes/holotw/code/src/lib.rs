#![feature(try_from)]
#[macro_use]
extern crate hdk;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
#[macro_use]
extern crate holochain_core_types_derive;
extern crate boolinator;
use boolinator::Boolinator;

use hdk::{
    entry_definition::ValidatingEntryType,
    error::ZomeApiResult,
};
use hdk::holochain_core_types::{
    cas::content::Address, entry::Entry, dna::entry_types::Sharing, error::HolochainError, 
    json::JsonString, 
};
use hdk::holochain_wasm_utils::api_serialization::{
        query::QueryResult,
        query::QueryArgsNames,
        query::QueryArgsOptions,
};

// see https://developer.holochain.org/api/0.0.4/hdk/ for info on using the hdk library

#[derive(Serialize, Deserialize, Debug, DefaultJson)]
pub struct Tiddler {
    title: String,
    text: String // This is really JSON, but not sure how to do this. JSONString has issues.
}

pub fn handle_create_tiddler(title: String, text: String) -> ZomeApiResult<Address> {
    let entry = Entry::App("tiddler".into(), Tiddler{title: title, text: text}.into());
    let address = hdk::commit_entry(&entry)?;
    Ok(address)
}

pub fn handle_get_tiddler(address: Address) -> ZomeApiResult<Option<Entry>> {
    hdk::get_entry(&address)
}

pub fn handle_update_tiddler(address: Address, title: String, text: String) -> ZomeApiResult<Address> {
    let post_entry = Entry::App("tiddler".into(),Tiddler{title: title, text: text}.into());

    hdk::update_entry(post_entry, &address)
}

pub fn handle_remove_tiddler(address: Address) -> ZomeApiResult<()> {
    hdk::remove_entry(&address)
}

pub fn handle_query_tiddlers() -> ZomeApiResult<QueryResult> {
    hdk::query_result("tiddler".into(), QueryArgsOptions{ start: 0, limit: 0, headers: false, entries:true})
}

fn definition() -> ValidatingEntryType {
    entry!(
        name: "tiddler",
        description: "A TiddlyWiki tiddler.",
        sharing: Sharing::Public,
        native_type: Tiddler,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        /* Don't try to validate for now, but might need to check for non-null string
        in title and core necessary structure in text. */
        validation: |tiddler: Tiddler, _validation_data: hdk::ValidationData| {
            (tiddler.title.len() >= 1)
                .ok_or_else(|| String::from("Title must be at least 1 character"))
        }
    )
}

define_zome! {
    entries: [
       definition()
    ]

    genesis: || { Ok(()) }

    functions: [
        create_tiddler: {
            inputs: |title: String, text: String|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_create_tiddler
        }
        get_tiddler: {
            inputs: |address: Address|,
            outputs: |result: ZomeApiResult<Option<Entry>>|,
            handler: handle_get_tiddler
        }
        update_tiddler: {
            inputs: |address: Address, title: String, text: String|,
            outputs: |result: ZomeApiResult<Address>|,
            handler: handle_update_tiddler
        }
        remove_tiddler: {
            inputs: |address: Address|,
            outputs: |result: ZomeApiResult<()>|,
            handler: handle_remove_tiddler
        }
        query_tiddlers: {
            inputs: | |,
            outputs: |result: ZomeApiResult<QueryResult>|,
            handler: handle_query_tiddlers
        }
    ]

    traits: {
        hc_public [create_tiddler,get_tiddler,update_tiddler,remove_tiddler,query_tiddlers]
    }
}
