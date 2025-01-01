
import { useQuery } from "react-query";
import {getAnnoymousUserPrompts} from "../apis";
export const useWorldMap = () => {
    const {isLoading, data} = useQuery('worldMap', getAnnoymousUserPrompts);
    return {isLoading, data};
}



