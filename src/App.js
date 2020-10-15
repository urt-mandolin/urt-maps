import React, { useState, useEffect, useRef } from 'react';
import { Stitch, AnonymousCredential } from 'mongodb-stitch-browser-sdk'; // package for connecting to our MongoDB-Realm app; Realm is the new name for Stitch but this package still works
import MapCard from './MapCard';
import TagsList from './TagsList';
import './App.css'; // style sheet for just this app component
import { Badge, CssBaseline, InputAdornment, InputBase } from '@material-ui/core'; // reset CSS properties across browsers to a baseline, and controls
import { Search } from '@material-ui/icons';

export default function App() {
    const CONNECTED = 'IS connected';
    const NOTCONNECTED = 'is NOT connected';
    const [isConnected, setIsConnected] = useState(NOTCONNECTED);
    const mongoClient = useRef(); // for saving the mongoClient object across renders of this component;  *** may not need to save this if only used in one function
    // const mongoUser = useRef();  // *** not sure we need to save this
    const [maps, setMaps] = useState(); // all the maps from the database, full object details per map
    const [visibleMaps, setVisibleMaps] = useState([]); // array of map objects
    const tagsWithMaps_Map = useRef(new Map()); // tagsWithMaps_Map is a Map that "maps" tags to a string array with the names of maps.  Sorry for confusing terms
    const [visibleTags_Map, setVisibleTags_Map] = useState(new Map());
    const [clickedTags_Set, setClickedTags_Set] = useState(new Set());
    const [searchInput, setSearchInput] = useState(''); // complains about switching from uncontrolled to controlled input without an empty string to start

    // this is where we connect to the database, and save it all into "maps"
    useEffect(() => {
        setIsConnected('is connecting...');
        // initializeDefaultAppClient is really picky, only wants to be run once.  And saving the referenece to it is also picky
        mongoClient.current = Stitch.initializeDefaultAppClient('fsk-realmapp-slofx'); // string is app ID (realmApp, not realMapp)

        const creds = new AnonymousCredential();
        mongoClient.current.auth.loginWithCredential(creds).then((user) => {
            // *** user unneeded? ^
            setIsConnected(CONNECTED);
            // mongoUser.current = user;
            mongoClient.current.callFunction('getAllMapData').then((response) => {
                setMaps(response.result);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // the empty array at the end means this hook only runs once, after the web page is done with the initial render

    // when "maps" changes, this (re)-writes tagsWithMaps_Map, clickedTagsList, and visibleTagsList
    useEffect(() => {
        if (maps) {
            maps.forEach((singleMap) => {
                singleMap.featureTags.forEach((tag) => {
                    let mapNamesArray = tagsWithMaps_Map.current.get(tag);
                    if (!mapNamesArray) {
                        mapNamesArray = [singleMap._id]; // array with a string in it, not just a string alone
                    } else {
                        mapNamesArray.push(singleMap._id); // add map name to array
                    }

                    tagsWithMaps_Map.current.set(tag, mapNamesArray); // add pair to Map, tag: mapNamesArray
                });
            });

            setClickedTags_Set(new Set()); // trigger initial creation of visibleTags and visibleMaps
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maps]);

    // this hook updates visibleMaps when clickedTags_Set changes
    useEffect(() => {
        if (!clickedTags_Set || clickedTags_Set.size < 1) {
            setVisibleMaps(maps); // all maps visible
            setVisibleTags_Map(tagsWithMaps_Map.current); // all tags visible
            return;
        }

        let newVisibleMaps = maps.filter((singleMap) => {
            let include = true;
            clickedTags_Set.forEach((tag) => {
                include &= singleMap.featureTags.includes(tag); // a map must have every clicked tag to be included
            });
            return include ? singleMap : null;
        });
        setVisibleMaps(newVisibleMaps);

        let newVisibleTags = new Map();
        newVisibleMaps.forEach((singleMap) => {
            singleMap.featureTags.forEach((tag) => {
                let mapNamesArray = newVisibleTags.get(tag);
                if (!mapNamesArray) {
                    mapNamesArray = [singleMap._id]; // array with a string in it, not just a string alone
                } else {
                    mapNamesArray.push(singleMap._id); // add map name to array
                }

                newVisibleTags.set(tag, mapNamesArray); // add pair to Map, tag: mapNamesArray
            });
        });
        setVisibleTags_Map(newVisibleTags);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clickedTags_Set]);

    function handleMapFilterClick(tag) {
        let newTagsList = new Set(clickedTags_Set); // shallow copy
        if (newTagsList.has(tag)) {
            newTagsList.delete(tag);
        } else {
            newTagsList.add(tag);
        }

        setClickedTags_Set(newTagsList);
        setSearchInput([...newTagsList].toString()); // *** just for real-time testing
    }

    function handleSearchChange(event) {
        setSearchInput(event.target.value);

        // todo:  parse input in real-time and generate tags
    }

    // return is what renders the html (and jsx) of our component:
    return (
        <>
            <CssBaseline />
            <header className='App-header'>
                <h1>
                    <Badge
                        badgeContent={
                            'database ' +
                            isConnected +
                            ' | ' +
                            (visibleMaps ? visibleMaps.length : '0') +
                            ' maps visible'
                        }
                        color={isConnected === CONNECTED ? 'primary' : 'error'}>
                        URT MAPS
                    </Badge>
                </h1>
            </header>
            <div id='searchBar'>
                <InputBase
                    placeholder='start typing map keywords here, separated by commas'
                    id='searchBox'
                    inputProps={{ 'aria-label': 'naked' }}
                    endAdornment={
                        <InputAdornment position='end'>
                            <Search />
                        </InputAdornment>
                    }
                    value={searchInput}
                    onChange={handleSearchChange}
                    fullWidth
                />
            </div>
            <div>
                Realtime test, showing your <em>typed text or clicked tag:</em>&nbsp; {searchInput.toString()}
            </div>
            <h2>
                <Badge badgeContent={visibleTags_Map.size + ' visible'} color='primary'>
                    Map feature tags
                </Badge>
            </h2>
            <div style={{ paddingRight: '12px' }}>
                {/* ^ that padding prevents badges cutting off, or a horizontal scroll bar */}
                <TagsList
                    visibleTagsList={[...visibleTags_Map.entries()]}
                    clickedTagsList={clickedTags_Set}
                    callBackFunc={handleMapFilterClick}
                />
            </div>
            <br />
            <div id='cardList'>
                {visibleMaps
                    ? visibleMaps.map((aMap) => <MapCard name={aMap._id} ss={aMap.screenShots} key={aMap._id} />)
                    : 'loading maps...'}
            </div>
        </>
    );
}
