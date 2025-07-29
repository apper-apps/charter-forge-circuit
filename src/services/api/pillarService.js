const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const pillarService = {
  async getAll() {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "description" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } }
        ],
        orderBy: [
          {
            fieldName: "CreatedOn",
            sorttype: "ASC"
          }
        ]
      };

      const response = await apperClient.fetchRecords("pillar", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching pillars:", error?.response?.data?.message);
      } else {
        console.error("Error fetching pillars:", error.message);
      }
      throw error;
    }
  },

  async getById(pillarId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "description" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } }
        ]
      };

      const response = await apperClient.getRecordById("pillar", pillarId, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error(`Error fetching pillar with ID ${pillarId}:`, error?.response?.data?.message);
      } else {
        console.error(`Error fetching pillar with ID ${pillarId}:`, error.message);
      }
      throw error;
    }
  },

  async create(pillarData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Name: pillarData.Name,
        Tags: pillarData.Tags,
        Owner: parseInt(pillarData.Owner),
        description: pillarData.description
      };

      const params = {
        records: [updateableData]
      };

      const response = await apperClient.createRecord("pillar", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create pillars ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          
          failedRecords.forEach(record => {
            record.errors?.forEach(error => {
              throw new Error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) throw new Error(record.message);
          });
        }
        
        return successfulRecords.length > 0 ? successfulRecords[0].data : null;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error creating pillar:", error?.response?.data?.message);
      } else {
        console.error("Error creating pillar:", error.message);
      }
      throw error;
    }
  },

  async update(pillarId, pillarData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Id: pillarId,
        Name: pillarData.Name,
        Tags: pillarData.Tags,
        Owner: parseInt(pillarData.Owner),
        description: pillarData.description
      };

      const params = {
        records: [updateableData]
      };

      const response = await apperClient.updateRecord("pillar", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update pillars ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              throw new Error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) throw new Error(record.message);
          });
        }
        
        return successfulUpdates.length > 0 ? successfulUpdates[0].data : null;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating pillar:", error?.response?.data?.message);
      } else {
        console.error("Error updating pillar:", error.message);
      }
      throw error;
    }
  },

  async delete(pillarIds) {
    try {
      const recordIds = Array.isArray(pillarIds) ? pillarIds : [pillarIds];
      
      const params = {
        RecordIds: recordIds
      };

      const response = await apperClient.deleteRecord("pillar", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete pillars ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
        
        return successfulDeletions.length === recordIds.length;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting pillars:", error?.response?.data?.message);
      } else {
        console.error("Error deleting pillars:", error.message);
      }
      throw error;
    }
  }
};