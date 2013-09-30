var upcoming = ["Extension update notifications",
                "Support for \"rich\" notification API",
                "my.secondlife.com direct message notifications",
                "Custom formatting of location names"];

var distant = ["Only show desktop notifications for certain friends",
               "Notification sounds",
               "SL Marketplace support"];

var versions = [
    {version: "1.0.9.2",
	    name: "Scrolling to solutions",
	 changes: ["Removed scrollbar from popout", "Added custom scrollbar to options page"],
	   fixes: ["Fixed positioning of icon badge on the icon preview"]},
    {version: "1.0.9",
	    name: "Strapping on a new Interface",
	 changes: ["Complete overhual of the options page's user interface"],
	   fixes: []},
	{version: "1.0.8",
	    name: "The long overdue update",
	 changes: ["Added color options",
	           "UI tweaks on Options page",
	           "New fonts across all pages"],
	   fixes: ["Added rudimentary plain-text notifications for Chrome versions that no longer support HTML"]},

	{version: "1.0.7",
	    name: "Unexpected Deprecation",
	 changes: [],
	   fixes: ["Some Chrome versions are no longer able to display desktop notifications",
	           "Handle bug where secondlife.com sometimes returns 0 friends"]},

	{version: "1.0.6",
	    name: "Housekeeping #1",
	 changes: [/*"Introduced anonymous tracking; see Options page to opt out"*/], // Tracking has been put on a back burner for now
	   fixes: ["Popping out the popup from Options uses the same dummy info",
	           "Popping out the popup matches screen location more accurately",
	           "Popout button didn't always appear",
	           "Handle lack of connectivity better"]},

	{version: "1.0.5",
	    name: "Map links and pop-outs and change logs, oh my!",
	 changes: ["Added detection of location for friends that give map rights",
	           "Added options to change popup to pop out",
	           "Added changelog UI"],
	   fixes: ["Labels on Options page now toggle checkboxes"]},

	{version: "1.0.1",
	    name: "The Darl update",
	 changes: [],
	   fixes: ["Failed to properly detect a zero balance of L$"]},

	{version: "1.0.0",
	    name: "We're releasing on time!",
	 changes: ["New method of handling OpenID",
	           "Internal code refactoring",
	           "Added live-updating previews to Options page",
	           "Added custom CSS that applies to all visible extension pages"],
	   fixes: ["Optimized cache to use less space"]},

	{version: "0.9.9",
	    name: "We're almost there!",
	 changes: ["Added option to gray out profiles in offline notifications"],
	   fixes: ["Ignore \"Resident\" when referencing users internally",
	           "Various other bug fixes"]},

	{version: "0.9.8",
	    name: "The big restructure",
	 changes: ["Changed underlying data structure to allow user metadata",
	           "Added cache to access data on offline users",
	           "Added option to hide icon badge when no users are online",
	           "Added username formatting"],
	   fixes: []},

	{version: "0.9.0",
	    name: "The public beta",
	 changes: ["New Options page with more options",
	           "Popup updates automatically when data changes",
	           "Removed update URL for Chrome Web Store"],
	   fixes: []},

	{version: "0.8.5",
	    name: "OpenID, thou hast been conquered!",
	 changes: ["Added option to display version number",
	           "Username no longer needs to be manually supplied"],
	   fixes: []},

	{version: "0.8.2",
	    name: "Not all updates have to be exciting",
	 changes: ["Minor tweaks and improvements"],
	   fixes: []},

	{version: "0.8.0",
	    name: "You could have guessed this was coming",
	 changes: ["Added desktop notifications"],
	   fixes: []}
];
