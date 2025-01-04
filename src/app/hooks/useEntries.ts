import { useMutation, useQuery } from "react-query";
import { getConvoEntries, deleteConvoEntry } from '../apis/index'
import { toast } from 'react-toastify';
import { AxiosError } from "axios";

const useEntries = () => {
    const { isLoading, data , refetch } = useQuery('convoEntries', getConvoEntries);

    const deleteEntryMutation = useMutation((variables: { id: string }) => deleteConvoEntry(variables.id), {
        onSuccess: () => {
            refetch()
        },
        onError: (error: AxiosError) => {
            toast.error(error.message)
        }
    })

    const handleDeleteEntry = async (id: string) => {
        return await deleteEntryMutation.mutateAsync({ id });
    }


    return { isLoading, data , handleDeleteEntry};

};

export default useEntries;