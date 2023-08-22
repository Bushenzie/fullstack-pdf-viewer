import { LSController } from "../utils/localStorage";
import { BsFillTrashFill } from "react-icons/bs"

function Header({title}) {
    return(
        <div className="title-wrapper">
            <h1>{title}</h1>
            <button className="clear-localStorage" onClick={() => {LSController.clear()}}><BsFillTrashFill/> LocalStorage</button>
        </div>
    )
}

export default Header;