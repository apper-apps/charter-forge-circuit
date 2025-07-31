const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const questionService = {
  async getAllQuestions() {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "text" } },
          { field: { Name: "order" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        orderBy: [
          {
            fieldName: "order",
            sorttype: "ASC"
          }
        ]
      };

      const response = await apperClient.fetchRecords("question", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching questions:", error?.response?.data?.message);
      } else {
        console.error("Error fetching questions:", error.message);
      }
      throw error;
    }
  },

  async getQuestionsByPillar(pillarId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "text" } },
          { field: { Name: "order" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "pillarId",
            Operator: "EqualTo",
            Values: [parseInt(pillarId)]
          }
        ],
        orderBy: [
          {
            fieldName: "order",
            sorttype: "ASC"
          }
        ]
      };

      const response = await apperClient.fetchRecords("question", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching questions for pillar:", error?.response?.data?.message);
      } else {
        console.error("Error fetching questions for pillar:", error.message);
      }
      throw error;
    }
  },

  async getQuestionById(questionId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "text" } },
          { field: { Name: "order" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ]
      };

      const response = await apperClient.getRecordById("question", questionId, params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error(`Error fetching question with ID ${questionId}:`, error?.response?.data?.message);
      } else {
        console.error(`Error fetching question with ID ${questionId}:`, error.message);
      }
      throw error;
    }
  },

  async createQuestion(questionData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Name: questionData.Name,
        pillarId: parseInt(questionData.pillarId), // Handle lookup field as integer
        text: questionData.text,
        order: parseInt(questionData.order)
      };

      const params = {
        records: [updateableData]
      };

      const response = await apperClient.createRecord("question", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedCreates = response.results.filter(result => !result.success);
        
        if (failedCreates.length > 0) {
          console.error(`Failed to create question ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
          
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
        console.error("Error creating question:", error?.response?.data?.message);
      } else {
        console.error("Error creating question:", error.message);
      }
      throw error;
    }
  },

  async updateQuestion(questionId, questionData) {
    try {
      // Prepare data with only Updateable fields
      const updateableData = {
        Name: questionData.Name,
        pillarId: parseInt(questionData.pillarId), // Handle lookup field as integer
        text: questionData.text,
        order: parseInt(questionData.order)
      };

      const params = {
        records: [
          {
            Id: parseInt(questionId),
            ...updateableData
          }
        ]
      };

      const response = await apperClient.updateRecord("question", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update question ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          
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
        console.error("Error updating question:", error?.response?.data?.message);
      } else {
        console.error("Error updating question:", error.message);
      }
      throw error;
    }
  },

  async deleteQuestion(questionId) {
    try {
      const params = {
        RecordIds: [parseInt(questionId)]
      };

      const response = await apperClient.deleteRecord("question", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete question ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
          
          failedDeletions.forEach(record => {
            if (record.message) throw new Error(record.message);
          });
        }
        
        const successfulDeletions = response.results.filter(result => result.success);
        return successfulDeletions.length > 0;
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting question:", error?.response?.data?.message);
      } else {
        console.error("Error deleting question:", error.message);
      }
      throw error;
    }
  }
};