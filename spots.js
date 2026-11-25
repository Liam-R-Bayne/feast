/*
  THE SPOTS (one per filming location, shown as dots on the globe)
  Built from the "Spots" sheet of "Stoke Feast videos.xlsx" by
  tools/import_spreadsheet.py.

  The dot size comes from how many videos list the spot in "locations".
  Spots with lat/lng set to null have a page but no dot yet.
*/
window.SPOTS = [
  {"id": "moab", "name": "Moab", "region": "Utah", "country": "United States", "continent": "North America", "lat": 38.5733, "lng": -109.5498},
  {"id": "yosemite", "name": "Yosemite", "region": "Yosemite Valley, California", "country": "United States", "continent": "North America", "lat": 37.7456, "lng": -119.5936},
  {"id": "san-francisco", "name": "San Francisco", "region": "Marin Headlands, Bay Area, California", "country": "United States", "continent": "North America", "lat": 37.827, "lng": -122.499},
  {"id": "squamish", "name": "Squamish", "region": "Stawamus Chief, British Columbia", "country": "Canada", "continent": "North America", "lat": 49.6833, "lng": -123.1417},
  {"id": "arrejo-secco", "name": "Arrejo Secco", "region": "Arroyo Seco, Monterey County, California", "country": "United States", "continent": "North America", "lat": 36.2336, "lng": -121.4836},
  {"id": "boulder", "name": "Boulder", "region": "Colorado (Front Range)", "country": "United States", "continent": "North America", "lat": 40.015, "lng": -105.2705},
  {"id": "hawaii", "name": "Hawaii", "region": "Oahu, Hawaii", "country": "United States", "continent": "Oceania", "lat": 21.4389, "lng": -158.0001},
  {"id": "tasmania", "name": "Tasmania", "region": "Totem Pole, Cape Hauy, Tasman Peninsula", "country": "Australia", "continent": "Oceania", "lat": -43.142, "lng": 148.001},
  {"id": "churfisten", "name": "Churfisten", "region": "St. Gallen, above Walensee", "country": "Switzerland", "continent": "Europe", "lat": 47.156, "lng": 9.29},
  {"id": "norway", "name": "Norway", "region": "", "country": "Norway", "continent": "Europe", "lat": null, "lng": null},
  {"id": "morocco", "name": "Morocco", "region": "", "country": "Morocco", "continent": "Africa", "lat": null, "lng": null},
  {"id": "castleton-tower", "name": "Castleton Tower", "region": "Castle Valley, Utah", "country": "United States", "continent": "North America", "lat": 38.6497, "lng": -109.3684},
  {"id": "eichhorn-pinnacle", "name": "Eichhorn Pinnacle", "region": "Tuolumne / Yosemite high country, California", "country": "United States", "continent": "North America", "lat": 37.8478, "lng": -119.4069},
  {"id": "japan", "name": "Japan", "region": "", "country": "Japan", "continent": "Asia", "lat": null, "lng": null},
  {"id": "the-lions", "name": "The Lions", "region": "North Shore Mountains, British Columbia", "country": "Canada", "continent": "North America", "lat": 49.4575, "lng": -123.1883},
  {"id": "magic-wood", "name": "Magic Wood", "region": "Averstal, Graubünden", "country": "Switzerland", "continent": "Europe", "lat": 46.53, "lng": 9.44},
  {"id": "stuttgart", "name": "Stuttgart", "region": "Baden-Württemberg", "country": "Germany", "continent": "Europe", "lat": 48.7758, "lng": 9.1829}
];
