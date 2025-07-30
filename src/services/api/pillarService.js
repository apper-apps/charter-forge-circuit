const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const pillarService = {
  async getAllPillars() {
    try {
      const params = {
fields: [
          { field: { Name: "Name" } },
          { field: { Name: "description" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "isVisible" } }
        ],
        where: [
          {
            FieldName: "isVisible",
            Operator: "EqualTo",
            Values: [true]
          }
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

  async getPillarById(pillarId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "description" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ]
      };

      const response = await apperClient.getRecordById("pillar", parseInt(pillarId), params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching pillar:", error?.response?.data?.message);
      } else {
        console.error("Error fetching pillar:", error.message);
      }
      throw error;
    }
  },

  async createPillar(pillarData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Name: pillarData.Name,
        description: pillarData.description,
        Tags: pillarData.Tags,
        Owner: parseInt(pillarData.Owner)
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
        const failedCreates = response.results.filter(result => !result.success);
        
        if (failedCreates.length > 0) {
          console.error(`Failed to create pillar ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
          
          failedCreates.forEach(record => {
            record.errors?.forEach(error => {
              throw new Error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) throw new Error(record.message);
          });
        }
        
        const successfulCreates = response.results.filter(result => result.success);
        return successfulCreates.length > 0 ? successfulCreates[0].data : null;
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

  async updatePillar(pillarId, pillarData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Id: parseInt(pillarId),
        Name: pillarData.Name,
        description: pillarData.description,
        Tags: pillarData.Tags,
        Owner: parseInt(pillarData.Owner)
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
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update pillar ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
          failedUpdates.forEach(record => {
            record.errors?.forEach(error => {
              throw new Error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) throw new Error(record.message);
          });
        }
        
        const successfulUpdates = response.results.filter(result => result.success);
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

  async deletePillar(pillarId) {
    try {
      const params = {
        RecordIds: [parseInt(pillarId)]
      };

      const response = await apperClient.deleteRecord("pillar", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete pillar ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
        
        return failedDeletions.length === 0;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting pillar:", error?.response?.data?.message);
      } else {
        console.error("Error deleting pillar:", error.message);
      }
      throw error;
    }
  }
};