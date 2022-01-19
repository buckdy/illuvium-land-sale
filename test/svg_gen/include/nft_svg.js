// NFTSvg.sol: JS Implementation
class NFTSvg {
    /**
    * @dev Returns the main svg array component, used in the top level of the generated land SVG.
    *
    * @param _gridSize The size of the grid
    * @param _tierId PlotView.tierId land tier id
    * @return The base for the land SVG, need to substitute LAND_TIER_ID and FUTURE_BOARD_CONTAINER
    */
    static _mainSvg(_gridSize, _tierId) {
        // Multiply by 3 to get number of grid squares = dimension of the isomorphic grid size

        return [
            "<svg height='",
            (_gridSize * 3 + 6).toString(), 
            "' width='",
            (_gridSize * 3).toString(), 
            "' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
            "<rect rx='5%' ry='5%' width='100%' height='99%' fill='url(#BOARD_BOTTOM_BORDER_COLOR_TIER_",
            _tierId.toString(),
            ")' stroke='none'/>",
            "<svg height='97.6%' width='100%' stroke-width='2' xmlns='http://www.w3.org/2000/svg'>",
            "FUTURE_BOARD_CONTAINER", // This line should be replaced in the loop
            "</svg>"
        ];
    }

    /**
    * @dev Returns the site base svg array component, used to represent
    *      a site inside the land board.
    *
    * @param _x Sites.x position
    * @param _y Sites.y position
    * @param _typeId Sites.typeId
    * @return The base SVG element for the sites
    */
    static _siteBaseSvg(_x, _y, _typeId) {
        const siteBaseSvgArray = new Array(7);
        siteBaseSvgArray[0] = "<svg x='";
        siteBaseSvgArray[1] = _x.toString();
        siteBaseSvgArray[2] = "' y='";
        siteBaseSvgArray[3] = _y.toString();
        siteBaseSvgArray[4] = "' width='6' height='6' xmlns='http://www.w3.org/2000/svg'><use href='#SITE_TYPE_";
        siteBaseSvgArray[5] = _typeId.toString();
        siteBaseSvgArray[6] = "' /></svg>";

        return siteBaseSvgArray.join("");
    }

    /**
    * @dev Returns the site base svg array component, used to represent
    *      a landmark inside the land board.
    *
    * @param _gridSize The size of the grid
    * @param _landmarkTypeId landmark type defined by its ID
    * @return Concatenation of the landmark SVG component to be added the board SVG
    */
    static _generateLandmarkSvg(_gridSize, _landmarkTypeId) {
        const landmarkPos = 3 * (_gridSize - 2) / 2;
        let landmarkFloatX;
        let landmarkFloatY;
        if (_gridSize % 2 == 0) {
            landmarkFloatX = parseInt(landmarkPos);
            landmarkFloatY = parseInt(landmarkPos - 3);
        } else {
            landmarkFloatX = (Math.ceil(landmarkPos) + 1).toString();
            landmarkFloatY = (Math.floor(landmarkPos) - 1).toString();
        }

        const landmarkSvgArray = new Array(7);
        landmarkSvgArray[0] = "<svg x='";
        landmarkSvgArray[1] = landmarkFloatX;
        landmarkSvgArray[2] = "' y='";
        landmarkSvgArray[3] = landmarkFloatY;
        landmarkSvgArray[4] = "' width='6' height='6' xmlns='http://www.w3.org/2000/svg'><use href='#LANDMARK_TYPE_";
        landmarkSvgArray[5] = _landmarkTypeId.toString();
        landmarkSvgArray[6] = "'/></svg>";

        return landmarkSvgArray.join("");
    }

    /**
    * @dev Returns the land board base svg array component, which has its color changed
    *      later in other functions.
    *
    * @param _gridSize The size of the grid
    * @param _tierId PlotView.tierId land tier id
    * @return Array of board SVG component parts
    */
    static _boardSvg(_gridSize, _tierId) {
        const scaledGridSize = 3 * _gridSize / 2;
        let scaledGridSizeString = parseFloat(scaledGridSize).toFixed(2);
        const integerDecimal = scaledGridSizeString.split('.');
        if (integerDecimal[1] == "00") {
            scaledGridSizeString = integerDecimal[0] + ".0";
        }
        return [
            "<defs><symbol id='SITE_TYPE_1' width='6' height='6'>", // Site Carbon
            "<svg width='6' height='6' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='12' height='12' fill='url(#site-type-1)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='site-type-1' x1='13.12' y1='1' x2='1.12' y2='13' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='SITE_TYPE_2' width='6' height='6'>", // Site Silicon
            "<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129011)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='paint0_linear_1321_129011' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#CBE2FF'/><stop offset='1' stop-color='#EFEFEF'/></linearGradient></defs></svg></symbol>",
            "<symbol id='SITE_TYPE_3' width='6' height='6'>", // Site Hydrogen
            "<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1320_145814)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='paint0_linear_1320_145814' x1='11.12' y1='1' x2='-0.862058' y2='7.11845' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#8CD4D9'/><stop offset='1' stop-color='#598FA6'/></linearGradient></defs></svg></symbol>",
            "<symbol id='SITE_TYPE_4' width='6' height='6'>", // Site Crypton
            "<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129013)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='paint0_linear_1321_129013' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop offset='1' stop-color='#52FF00'/></linearGradient></defs></svg></symbol>",
            "<symbol id='SITE_TYPE_5' width='6' height='6'>", // Site Hyperion
            "<svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129017)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='paint0_linear_1321_129017' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#31F27F'/><stop offset='0.296875' stop-color='#F4BE86'/><stop offset='0.578125' stop-color='#B26FD2'/>",
            "<stop offset='0.734375' stop-color='#7F70D2'/><stop offset='1' stop-color='#8278F2'/></linearGradient></defs></svg></symbol>",
            "<symbol id='SITE_TYPE_6' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>", // Site Solon
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_1321_129015)' stroke='white' stroke-opacity='0.5'/>",
            "<defs><linearGradient id='paint0_linear_1321_129015' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='white'/><stop offset='0.544585' stop-color='#FFD600'/><stop offset='1' stop-color='#FF9900'/>",
            "</linearGradient></defs></svg></symbol><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_5' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#BE13AE'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_4' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#1F7460'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_3' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#6124AE'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_2' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#5350AA'/></linearGradient><linearGradient id='BOARD_BOTTOM_BORDER_COLOR_TIER_1' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#2C2B67'/></linearGradient><linearGradient id='GRADIENT_BOARD_TIER_5' x1='100%' y1='0' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop offset='0.130208' stop-color='#EFD700'/><stop offset='0.6875' stop-color='#FF57EE'/><stop offset='1' stop-color='#9A24EC'/>",
            "</linearGradient><linearGradient id='GRADIENT_BOARD_TIER_4' x1='50%' y1='100%' x2='50%' y2='0' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#239378'/><stop offset='1' stop-color='#41E23E'/></linearGradient>",
            "<linearGradient id='GRADIENT_BOARD_TIER_3' x1='50%' y1='100%' x2='50%' y2='0' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#812DED'/><stop offset='1' stop-color='#F100D9'/></linearGradient>",
            "<linearGradient id='GRADIENT_BOARD_TIER_2' x1='50%' y1='0' x2='50%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#7DD6F2'/><stop offset='1' stop-color='#625EDC'/></linearGradient>",
            "<linearGradient id='GRADIENT_BOARD_TIER_1' x1='50%' y1='0' x2='50%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#4C44A0'/><stop offset='1' stop-color='#2F2C83'/></linearGradient>",
            "<linearGradient id='ROUNDED_BORDER_TIER_5' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#D2FFD9'/><stop offset='1' stop-color='#F32BE1'/></linearGradient>",
            "<linearGradient id='ROUNDED_BORDER_TIER_4' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
            "<linearGradient id='ROUNDED_BORDER_TIER_3' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
            "<linearGradient id='ROUNDED_BORDER_TIER_2' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
            "<linearGradient id='ROUNDED_BORDER_TIER_1' x1='100%' y1='16.6%' x2='100%' y2='100%' gradientUnits='userSpaceOnUse' xmlns='http://www.w3.org/2000/svg'>",
            "<stop stop-color='#fff' stop-opacity='0.38'/><stop offset='1' stop-color='#fff' stop-opacity='0.08'/></linearGradient>",
            "<pattern id='smallGrid' width='3' height='3' patternUnits='userSpaceOnUse' patternTransform='rotate(45 ",
            `${scaledGridSizeString} ${scaledGridSizeString})'>`,
            "<path d='M 3 0 L 0 0 0 3' fill='none' stroke-width='0.3%' stroke='#130A2A' stroke-opacity='0.2' />",
            "</pattern><symbol id='LANDMARK_TYPE_1' width='6' height='6'><svg width='6' height='6' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='12' height='12' fill='url(#paint0_linear_2371_558677)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.72' y='4.59998' width='4.8' height='4.8' fill='url(#paint1_linear_2371_558677)'/>",
            "<rect x='4.72' y='4.59998' width='4.8' height='4.8' fill='white'/>",
            "<defs><linearGradient id='paint0_linear_2371_558677' x1='13.12' y1='1' x2='1.12' y2='13' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558677' x1='9.52' y1='4.59998' x2='4.72' y2='9.39998' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_2' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558683)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558683)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
            "<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
            "<defs><linearGradient id='paint0_linear_2371_558683' x1='11.12' y1='1' x2='-0.862058' y2='7.11845' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#8CD4D9'/><stop offset='1' stop-color='#598FA6'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558683' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_3' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558686)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558686)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
            "<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
            "<defs><linearGradient id='paint0_linear_2371_558686' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#CBE2FF'/><stop offset='1' stop-color='#EFEFEF'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558686' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_4' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558689)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558689)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
            "<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
            "<defs><linearGradient id='paint0_linear_2371_558689' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#184B00'/><stop offset='1' stop-color='#52FF00'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558689' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_5' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558695)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558695)'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='white'/><rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/>",
            "<defs><linearGradient id='paint0_linear_2371_558695' x1='11.12' y1='1' x2='1.12' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#31F27F'/><stop offset='0.296875' stop-color='#F4BE86'/><stop offset='0.578125' stop-color='#B26FD2'/>",
            "<stop offset='0.734375' stop-color='#7F70D2'/><stop offset='1' stop-color='#8278F2'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558695' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_6' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2371_558692)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='4.12' y='4' width='4' height='4' fill='url(#paint1_linear_2371_558692)'/><rect x='4.12' y='4' width='4' height='4' fill='white'/>",
            "<rect x='3.62' y='3.5' width='5' height='5' stroke='black' stroke-opacity='0.1'/><defs><linearGradient id='paint0_linear_2371_558692' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='white'/><stop offset='0.544585' stop-color='#FFD600'/><stop offset='1' stop-color='#FF9900'/></linearGradient>",
            "<linearGradient id='paint1_linear_2371_558692' x1='8.12' y1='4' x2='4.12' y2='8' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "<symbol id='LANDMARK_TYPE_7' width='6' height='6'><svg width='6' height='6' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>",
            "<rect x='1.12' y='1' width='10' height='10' fill='url(#paint0_linear_2373_559424)' stroke='white' stroke-opacity='0.5'/>",
            "<rect x='3.12' y='3' width='6' height='6' fill='url(#paint1_linear_2373_559424)'/><rect x='3.12' y='3' width='6' height='6' fill='white'/>",
            "<rect x='2.62' y='2.5' width='7' height='7' stroke='black' stroke-opacity='0.1'/>",
            "<defs><linearGradient id='paint0_linear_2373_559424' x1='11.12' y1='1' x2='1.11999' y2='11' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color='#08CE01'/><stop offset='0.171875' stop-color='#CEEF00'/><stop offset='0.34375' stop-color='#51F980'/>",
            "<stop offset='0.5' stop-color='#2D51ED'/><stop offset='0.671875' stop-color='#0060F1'/><stop offset='0.833333' stop-color='#F100D9'/>",
            "<stop offset='1' stop-color='#9A24EC'/></linearGradient><linearGradient id='paint1_linear_2373_559424' x1='9.12' y1='3' x2='3.12' y2='9' gradientUnits='userSpaceOnUse'>",
            "<stop stop-color'#565656'/><stop offset='1'/></linearGradient></defs></svg></symbol>",
            "</defs><rect width='100%' height='100%' fill='url(#GRADIENT_BOARD_TIER_",
            _tierId.toString(), // This line should be replaced in the loop
            ")' stroke='none' rx='5%' ry='5%'/><svg x='",
            _gridSize % 2 == 0 ? "-17%" : "-18%",
            "' y='",
            _gridSize % 2 == 0 ? "-17%" : "-18%",
            "' width='",
            _gridSize % 2 == 0 ? "117%" : "117.8%",
            "' height='",
            _gridSize % 2 == 0 ? "116.4%" : "117.8%",
            "' ><g transform='scale(1.34)' rx='5%' ry='5%' ><rect x='",
            _gridSize % 2 == 0 ? "11%" : "11.6%",
            "' y='",
            _gridSize % 2 == 0 ? "11.2%" : "11.6%",
            "' width='",
            _gridSize % 2 == 0 ? "63.6%" : "63.0%",
            "' height='",
            _gridSize % 2 == 0 ? "63.8%" : "63.2%",
            "' fill='url(#smallGrid)' stroke='none'  rx='3%' ry='3%' /><g transform='rotate(45 ",
            `${scaledGridSizeString} ${scaledGridSizeString})'>`,
            "LANDMARK", // This line should be replaced by the Landmark in the loop
            "SITES_POSITIONED", // This line should be replaced in the loop
            "</g></g></svg>",
            "<rect xmlns='http://www.w3.org/2000/svg' x='0.3' y='0.3' width='99.7%' height='99.7%' fill='none' stroke='url(#ROUNDED_BORDER_TIER_",
            _tierId.toString(),
            ")' stroke-width='1' rx='4.5%' ry='4.5%'/></svg>"
        ];

    }

    /**
    * @dev Calculates string for the land name based on plot data.
    *
    * @param _regionId PlotView.regionId
    * @param _x PlotView.x coordinate
    * @param _y PlotView.y coordinate
    * @param _tierId PlotView.tierId land tier id
    * @return SVG name attribute
    */
    static _generateLandName(_regionId, _x, _y, _tierId) {
        return `Land Tier ${_tierId} - (${_regionId}, ${_x}, ${_y}`;
    }

    /**
    * @dev Calculates the string for the land metadata description.
    */
    static _generateLandDescription() {
        return "Describes the asset to which this NFT represents";
    }

    /**
    * @dev Populates the mainSvg array with the land tier id and the svg returned
    *      by the _generateLandBoard. Expects it to generate the land svg inside 
    *      the container.
    * 
    * @param _landmarkTypeId landmark type defined by its ID
    * @param _tierId PlotView.tierId land tier id
    * @param _gridSize The size of the grid
    * @param _sites Array of plot sites coming from PlotView struct
    * @return The SVG image component
    */
    static _generateSVG(
        _landmarkTypeId,
        _tierId,
        _gridSize,
        _sites
    ) {
        const _mainSvgTemplate = NFTSvg._mainSvg(_gridSize, _tierId);
        const _mainSvgLength = _mainSvgTemplate.length;
        const _mainSvgArray = new Array(_mainSvgLength);

        for(let i = 0; i < _mainSvgLength; i++) {
            if(_mainSvgTemplate[i] === "FUTURE_BOARD_CONTAINER") {
                _mainSvgArray[i] = NFTSvg._generateLandBoard(_tierId, _gridSize, _landmarkTypeId, _sites);
                continue;
            }
            _mainSvgArray[i] = _mainSvgTemplate[i];
        }
        return _mainSvgArray.join("");
    }

    /**
    * @dev Generates the plot svg containing all sites inside and color according
    *      to the tier
    * 
    * @param _tierId PlotView.tierId land tier id
    * @param _gridSize The size of the grid
    * @param _landmarkTypeId landmark type defined by its ID
    * @param _sites Array of plot sites coming from PlotView struct
    * @return The board component for the land SVG
    */
    static _generateLandBoard(
        _tierId,
        _gridSize,
        _landmarkTypeId,
        _sites
    ) {
        const _boardSvgTemplate = NFTSvg._boardSvg(_gridSize, _tierId);
        const _boardSvgArray = new Array(_boardSvgTemplate.length);

        for (let i = 0; i < _boardSvgTemplate.length; i++) {
            if (_boardSvgTemplate[i] === "SITES_POSITIONED") {
                _boardSvgArray[i] = NFTSvg._generateSites(_sites);
                continue;
            }
            if (_boardSvgTemplate[i] === "LANDMARK") {
                _boardSvgArray[i] = NFTSvg._generateLandmarkSvg(_gridSize, _landmarkTypeId);
                continue;
            }
            _boardSvgArray[i] = _boardSvgTemplate[i];
        }
        return _boardSvgArray.join("");
    }

    /**
    * @dev Generates each site inside the land svg board with is position and color.
    *
    * @param _sites Array of plot sites coming from PlotView struct
    * @return The sites components for the land SVG
    */
    static _generateSites(_sites) {
        const _siteSvgArray = new Array(_sites.length);
        for (let i = 0; i < _sites.length; i++) {
            _siteSvgArray[i] = NFTSvg._siteBaseSvg(
                NFTSvg._convertToSvgPositionX(_sites[i].x), 
                NFTSvg._convertToSvgPositionY(_sites[i].y), 
                _sites[i].typeId
            );
        }

        return _siteSvgArray.join("");
    }

    /**
    * @dev Main function, entry point to generate the complete land svg with all
    *      populated sites, correct color, and attach to the JSON metadata file
    *      created using Base64 lib.
    * @dev Returns the JSON metadata formatted file used by NFT platforms to display
    *      the land data.
    * @dev Can be updated in the future to change the way land name, description, image
    *      and other traits are displayed.
    *
    * @param _regionId PlotView.regionId
    * @param _x PlotView.x coordinate
    * @param _y PlotView.y coordinate
    * @param _tierId PlotView.tierId land tier id
    * @param _gridSize The size of the grid
    * @param _landmarkTypeId landmark type defined by its ID
    * @param _sites Array of plot sites coming from PlotView struct
    */
    static constructTokenURI(
        _regionId,
        _x,
        _y,
        _tierId,
        _gridSize,
        _landmarkTypeId,
        _sites
    ) {
        const name = NFTSvg._generateLandName(_regionId, _x, _y, _tierId);
        const description = NFTSvg._generateLandDescription();
        const image = Buffer.from(NFTSvg._generateSVG(_landmarkTypeId, _tierId, _gridSize, _sites))
            .toString("base64");

        return "data:application/json;base64, " + 
                Buffer.from(`{"name":"${name}", "description":"${description}", ` +
                    `"image": "data:image/svg+xml;base64,${image}"}`)
                    .toString("base64")
    }

    /**
    * @dev Convert site X position to fit into the board.
    *
    * @param _positionX X coordinate of the site
    * @return Transformed X coordinate
    */
    static _convertToSvgPositionX(_positionX) {
        return _positionX * 3;
    }

    /**
    * @dev Convert site Y position to fit into the board.
    *
    * @param _positionY Y coordinate of the site
    * @return Transformed Y coordinate
    */
    static _convertToSvgPositionY(_positionY) {
        return _positionY * 3;
    }
}

// LandDescriptorImpl.sol: JS Implementation
class LandDescriptor {
     static tokenURI(_plot) {
		// unpack the `_plot` structure and delegate generation into the lib
		return NFTSvg.constructTokenURI(
			_plot.regionId,
			_plot.x,
			_plot.y,
			_plot.tierId,
			_plot.size,
			_plot.landmarkTypeId,
			_plot.sites
		);
	}
}

module.exports = {
    NFTSvg,
    LandDescriptor,
};
