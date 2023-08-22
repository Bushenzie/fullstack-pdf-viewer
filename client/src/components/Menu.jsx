import { useContext,useState,useEffect } from "react";
import { PickContext } from "../App";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi"

let turnOffPDFExtension = false;


//Menu rozkládání -> chatgpt , recursion a objekty už ne
function Menu({data}) {
    const {setPickedFile,setMenuPickLoading} = useContext(PickContext);
    const [expandedKeys, setExpandedKeys] = useState([]);
    
    const handleToggleExpand = (key) => {
        setExpandedKeys((prevKeys) =>
        prevKeys.includes(key)
            ? prevKeys.filter((k) => k !== key)
            : [key]
        );
    };

    const renderValue = (value, key) => {
        if (typeof value === 'object') {
                if (key === 'files') {
                    return null; 
                }
                return (
                <div className={`menu-folder ${expandedKeys.includes(key) ? "is-clicked" : ""}`} key={key}>
                    <div className="menu-head" onClick={() => handleToggleExpand(key)}>
                        <span className="menu-head-name">{key}</span>
                        <span className="menu-head-icon">{expandedKeys.includes(key) ? (<IoIosArrowUp />) : (<IoIosArrowDown />)}</span>
                    </div>
                    {expandedKeys.includes(key) ? (<Menu data={value} />) : null}
                </div>
                );
        } else {
        return (
            <div key={key}>
                {value}
            </div>
        );
        }
    };

    return (
        <div className="items">
        {Object.entries(data).map(([key, value]) => {
            if (key === 'files' && Array.isArray(value)) {
                return value.map((item, index) => (
                    <div className="menu-item" key={index} onClick={() => {
                        setMenuPickLoading(true);
                        setPickedFile(item);
                    }}>
                    {turnOffPDFExtension ? item.replace(".pdf","") : item}
                    </div>
                ));
            }

            return renderValue(value, key);
        })}
        </div>
    )
}

export default Menu;